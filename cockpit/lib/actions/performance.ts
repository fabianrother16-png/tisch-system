"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { adCampaigns, integrations, posts, postSnapshots } from "../db/schema";
import { assertUser } from "../auth";
import { encrypt } from "../crypto";
import { int, isDate, money, num, str } from "../forms";
import { todayISO } from "../dates";
import { ACCOUNT_METRICS } from "../constants";
import { applyChoice } from "../integrations/providers";
import { syncAllCustomers, syncCustomer } from "../integrations/sync";
import { upsertAdStat, upsertMetric } from "../integrations/store";
import { platformFromUrl } from "../domain/platform";
import { logActivity } from "../domain/activity";
import { fail, success, type ActionState } from "./types";

function revalidateCustomer(customerId: number) {
  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/performance");
}

// ─── Anbindungen ───────────────────────────────────────────────────────────

export async function chooseAccount(integrationId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const choiceId = str(fd, "choice");
  const [row] = await db.select().from(integrations).where(eq(integrations.id, integrationId)).limit(1);
  if (!row || !choiceId) return fail("Bitte eine Auswahl treffen.");
  try {
    const chosen = await applyChoice(row, choiceId);
    await db
      .update(integrations)
      .set({
        externalId: chosen.externalId,
        name: chosen.name,
        ...(chosen.accessToken ? { accessToken: encrypt(chosen.accessToken) } : {}),
        ...(chosen.refreshToken ? { refreshToken: encrypt(chosen.refreshToken) } : {}),
      })
      .where(eq(integrations.id, integrationId));
    await syncCustomer(row.customerId, 90);
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
  revalidateCustomer(row.customerId);
  return success("Konto ausgewählt und erste Daten geladen");
}

export async function disconnectIntegration(integrationId: number): Promise<ActionState> {
  const user = await assertUser();
  const [row] = await db.select().from(integrations).where(eq(integrations.id, integrationId)).limit(1);
  if (!row) return fail("Nicht gefunden");
  await db.delete(integrations).where(eq(integrations.id, integrationId));
  await logActivity({ customerId: row.customerId, userId: user.id, title: `Anbindung getrennt: ${row.provider}` });
  revalidateCustomer(row.customerId);
  return success("Verbindung getrennt – bisherige Zahlen bleiben erhalten");
}

export async function syncCustomerNow(customerId: number): Promise<ActionState> {
  await assertUser();
  const results = await syncCustomer(customerId, 30);
  revalidateCustomer(customerId);
  if (!results.length) return fail("Für diesen Kunden ist noch nichts verbunden.");
  const failed = results.filter((r) => !r.ok);
  if (failed.length) return fail(failed.map((r) => `${r.label}: ${r.message}`).join(" · "));
  return success(results.map((r) => `${r.label}: ${r.message}`).join(" · "));
}

export async function syncEverything(): Promise<ActionState> {
  await assertUser();
  const all = await syncAllCustomers(7);
  const list = Object.values(all).flat();
  revalidatePath("/performance");
  revalidatePath("/");
  if (!list.length) return fail("Noch keine Kanäle verbunden.");
  const failed = list.filter((r) => !r.ok).length;
  return failed ? fail(`${list.length - failed} Anbindungen aktualisiert, ${failed} mit Fehler – Details beim jeweiligen Kunden.`) : success(`${list.length} Anbindungen aktualisiert`);
}

// ─── Manuelle Erfassung: Beiträge ──────────────────────────────────────────

export async function savePost(customerId: number, postId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const url = str(fd, "url");
  const publishedAt = str(fd, "publishedAt");
  const platform = str(fd, "platform") ?? platformFromUrl(url) ?? "instagram";
  if (!isDate(publishedAt)) return fail("Bitte Datum angeben.", { publishedAt: "Pflichtfeld" });
  const metrics = {
    views: int(fd, "views"),
    reach: int(fd, "reach"),
    likes: int(fd, "likes"),
    comments: int(fd, "comments"),
    shares: int(fd, "shares"),
    saves: int(fd, "saves"),
  };
  const values = {
    platform,
    url,
    caption: str(fd, "caption"),
    mediaType: str(fd, "mediaType"),
    publishedAt: publishedAt!,
    ...metrics,
    lastSyncedAt: new Date().toISOString(),
  };
  let id = postId;
  if (postId) {
    await db.update(posts).set(values).where(and(eq(posts.id, postId), eq(posts.customerId, customerId)));
  } else {
    const [row] = await db.insert(posts).values({ ...values, customerId, source: "manuell" }).returning();
    id = row.id;
  }
  await db
    .insert(postSnapshots)
    .values({ postId: id!, date: todayISO(), ...metrics })
    .onConflictDoUpdate({ target: [postSnapshots.postId, postSnapshots.date], set: metrics });
  revalidateCustomer(customerId);
  return success(postId ? "Zahlen aktualisiert" : "Beitrag erfasst");
}

export async function deletePost(customerId: number, postId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.customerId, customerId)));
  revalidateCustomer(customerId);
  return success("Beitrag entfernt");
}

// ─── Manuelle Erfassung: Konto-Kennzahlen ─────────────────────────────────

export async function saveAccountMetrics(customerId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const date = str(fd, "date");
  if (!isDate(date)) return fail("Bitte Datum angeben.", { date: "Pflichtfeld" });
  let n = 0;
  for (const m of ACCOUNT_METRICS) {
    const key = `${m.platform}:${m.metric}`;
    const raw = str(fd, key);
    if (raw == null) continue;
    await upsertMetric(customerId, m.platform, m.metric, date!, num(fd, key), "manuell");
    n++;
  }
  if (!n) return fail("Bitte mindestens einen Wert eintragen.");
  revalidateCustomer(customerId);
  return success(`${n} Wert${n === 1 ? "" : "e"} gespeichert`);
}

// ─── Manuelle Erfassung: Werbung ───────────────────────────────────────────

export async function saveCampaign(customerId: number, campaignId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const name = str(fd, "name");
  if (!name) return fail("Bitte Kampagnennamen angeben.", { name: "Pflichtfeld" });
  const values = {
    name,
    platform: str(fd, "platform") ?? "meta",
    status: str(fd, "status") ?? "aktiv",
    objective: str(fd, "objective"),
    dailyBudget: money(fd, "dailyBudget") || null,
    startDate: str(fd, "startDate"),
    endDate: str(fd, "endDate"),
  };
  let id = campaignId;
  if (campaignId) await db.update(adCampaigns).set(values).where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.customerId, customerId)));
  else {
    const [row] = await db.insert(adCampaigns).values({ ...values, customerId, source: "manuell" }).returning();
    id = row.id;
  }
  // Optional direkt erste Zahlen
  const date = str(fd, "statDate");
  if (date && id && (str(fd, "spend") || str(fd, "clicks"))) {
    await upsertAdStat(id, date, {
      spend: money(fd, "spend"),
      impressions: int(fd, "impressions"),
      clicks: int(fd, "clicks"),
      reach: int(fd, "reach"),
      conversions: num(fd, "conversions"),
    });
  }
  revalidateCustomer(customerId);
  return success(campaignId ? "Kampagne gespeichert" : "Kampagne angelegt");
}

export async function saveAdStats(customerId: number, campaignId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const date = str(fd, "statDate");
  if (!isDate(date)) return fail("Bitte Datum angeben.", { statDate: "Pflichtfeld" });
  await upsertAdStat(campaignId, date!, {
    spend: money(fd, "spend"),
    impressions: int(fd, "impressions"),
    clicks: int(fd, "clicks"),
    reach: int(fd, "reach"),
    conversions: num(fd, "conversions"),
  });
  revalidateCustomer(customerId);
  return success("Zahlen gespeichert");
}

export async function deleteCampaign(customerId: number, campaignId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(adCampaigns).where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.customerId, customerId)));
  revalidateCustomer(customerId);
  return success("Kampagne gelöscht");
}
