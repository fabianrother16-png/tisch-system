"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { trackingLinks } from "../db/schema";
import { assertUser } from "../auth";
import { optInt, str } from "../forms";
import { randomToken } from "../crypto";
import { fail, success, type ActionState } from "./types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function saveLink(linkId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const label = str(fd, "label");
  let targetUrl = str(fd, "targetUrl");
  const errors: Record<string, string> = {};
  if (!label) errors.label = "Bitte eine Bezeichnung angeben";
  if (!targetUrl) errors.targetUrl = "Bitte Ziel-Adresse angeben";
  if (targetUrl && !/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;
  try {
    if (targetUrl) new URL(targetUrl);
  } catch {
    errors.targetUrl = "Ungültige Adresse";
  }
  let slug = slugify(str(fd, "slug") ?? "");
  if (!slug && !linkId) slug = randomToken(5).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toLowerCase();
  if (slug && ["api", "go", "login"].includes(slug)) errors.slug = "Dieses Kürzel ist reserviert";
  if (slug) {
    const [clash] = await db
      .select({ id: trackingLinks.id })
      .from(trackingLinks)
      .where(and(eq(trackingLinks.slug, slug), linkId ? ne(trackingLinks.id, linkId) : undefined))
      .limit(1);
    if (clash) errors.slug = "Dieses Kürzel ist schon vergeben";
  }
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);
  const values = {
    label: label!,
    targetUrl: targetUrl!,
    channel: str(fd, "channel") ?? "sonstiges",
    customerId: optInt(fd, "customerId"),
    ...(slug ? { slug } : {}),
  };
  let id = linkId;
  if (linkId) await db.update(trackingLinks).set(values).where(eq(trackingLinks.id, linkId));
  else {
    const [row] = await db.insert(trackingLinks).values({ ...values, slug }).returning();
    id = row.id;
  }
  revalidatePath("/links");
  if (values.customerId) revalidatePath(`/kunden/${values.customerId}`);
  return success(linkId ? "Link gespeichert" : "Tracking-Link erstellt", { redirectTo: linkId ? undefined : `/links/${id}` });
}

export async function toggleLink(linkId: number, active: boolean): Promise<ActionState> {
  await assertUser();
  await db.update(trackingLinks).set({ active }).where(eq(trackingLinks.id, linkId));
  revalidatePath("/links");
  revalidatePath(`/links/${linkId}`);
  return success(active ? "Link aktiviert" : "Link pausiert – Aufrufe landen auf einer Hinweisseite");
}

export async function deleteLink(linkId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(trackingLinks).where(eq(trackingLinks.id, linkId));
  revalidatePath("/links");
  return success("Link gelöscht", { redirectTo: "/links" });
}
