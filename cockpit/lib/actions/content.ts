"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { contents, customers, events, posts } from "../db/schema";
import { assertUser } from "../auth";
import { logActivity } from "../domain/activity";
import { bool, list, optInt, str } from "../forms";
import { CONTENT_STATUS, CONTENT_STATUS_MAP, CONTENT_FORMAT_MAP } from "../constants";
import { currentMonth, todayISO } from "../dates";
import { fail, success, type ActionState } from "./types";
import { platformFromUrl } from "../domain/platform";

/** Legt für einen veröffentlichten Content automatisch einen Beitrag für die Performance-Messung an. */
async function ensurePost(contentId: number) {
  const [c] = await db.select().from(contents).where(eq(contents.id, contentId)).limit(1);
  if (!c || c.status !== "veroeffentlicht" || !c.publishedUrl) return;
  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.contentId, contentId)).limit(1);
  if (existing) {
    await db.update(posts).set({ url: c.publishedUrl }).where(eq(posts.id, existing.id));
    return;
  }
  const platform = platformFromUrl(c.publishedUrl) ?? c.platforms[0] ?? "instagram";
  await db.insert(posts).values({
    customerId: c.customerId,
    contentId: c.id,
    platform,
    url: c.publishedUrl,
    caption: c.title,
    mediaType: CONTENT_FORMAT_MAP[c.format]?.label ?? c.format,
    publishedAt: c.publishDate ?? todayISO(),
    source: "manuell",
  });
}

export async function saveContent(contentId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const customerId = optInt(fd, "customerId");
  const title = str(fd, "title");
  const errors: Record<string, string> = {};
  if (!customerId) errors.customerId = "Bitte Kunden wählen";
  if (!title) errors.title = "Bitte einen Titel angeben";
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);

  const status = str(fd, "status") ?? "idee";
  const values = {
    customerId: customerId!,
    title: title!,
    format: str(fd, "format") ?? "reel",
    platforms: list(fd, "platforms"),
    status: CONTENT_STATUS.some((s) => s.value === status) ? status : "idee",
    assigneeId: optInt(fd, "assigneeId"),
    periodMonth: str(fd, "periodMonth") ?? currentMonth(),
    shootDate: str(fd, "shootDate"),
    dueDate: str(fd, "dueDate"),
    publishDate: str(fd, "publishDate"),
    concept: str(fd, "concept"),
    notes: str(fd, "notes"),
    publishedUrl: str(fd, "publishedUrl"),
    clientApproved: bool(fd, "clientApproved"),
    updatedAt: new Date().toISOString(),
  };

  let id = contentId;
  if (contentId) {
    await db.update(contents).set(values).where(eq(contents.id, contentId));
  } else {
    const [created] = await db.insert(contents).values(values).returning();
    id = created.id;
    await logActivity({ customerId: values.customerId, userId: user.id, title: `Content geplant: ${values.title}`, refType: "content", refId: id });
  }

  // Drehtermin direkt in den Kalender übernehmen
  if (bool(fd, "createShootEvent") && values.shootDate && id) {
    const [customer] = await db.select({ name: customers.name, street: customers.street, city: customers.city }).from(customers).where(eq(customers.id, values.customerId)).limit(1);
    const time = str(fd, "shootTime") ?? "10:00";
    const [h, m] = time.split(":").map(Number);
    const endH = String(Math.min(23, h + 2)).padStart(2, "0");
    await db.insert(events).values({
      title: `Dreh: ${values.title}`,
      type: "dreh",
      start: `${values.shootDate}T${time}`,
      end: `${values.shootDate}T${endH}:${String(m || 0).padStart(2, "0")}`,
      customerId: values.customerId,
      contentId: id,
      location: [customer?.street, customer?.city].filter(Boolean).join(", ") || null,
      assigneeIds: values.assigneeId ? [values.assigneeId] : [],
      countsAsVisit: true,
      createdBy: user.id,
    });
  }

  if (id) await ensurePost(id);
  revalidatePath("/content");
  revalidatePath(`/kunden/${values.customerId}`);
  revalidatePath("/");
  return success(contentId ? "Gespeichert" : "Content angelegt");
}

export async function moveContent(contentId: number, status: string): Promise<ActionState> {
  const user = await assertUser();
  if (!CONTENT_STATUS.some((s) => s.value === status)) return fail("Unbekannter Status");
  const [c] = await db.select().from(contents).where(eq(contents.id, contentId)).limit(1);
  if (!c) return fail("Nicht gefunden");
  const patch: Partial<typeof contents.$inferInsert> = { status, updatedAt: new Date().toISOString() };
  if (status === "veroeffentlicht" && !c.publishDate) patch.publishDate = todayISO();
  await db.update(contents).set(patch).where(eq(contents.id, contentId));
  if (status === "veroeffentlicht") {
    await logActivity({ customerId: c.customerId, userId: user.id, title: `Veröffentlicht: ${c.title}`, refType: "content", refId: c.id });
    await ensurePost(contentId);
  }
  revalidatePath("/content");
  revalidatePath(`/kunden/${c.customerId}`);
  revalidatePath("/");
  return success(`→ ${CONTENT_STATUS_MAP[status]?.label ?? status}`);
}

export async function deleteContent(contentId: number): Promise<ActionState> {
  await assertUser();
  const [c] = await db.select({ customerId: contents.customerId }).from(contents).where(eq(contents.id, contentId)).limit(1);
  await db.delete(contents).where(eq(contents.id, contentId));
  await db.update(posts).set({ contentId: null }).where(eq(posts.contentId, contentId));
  revalidatePath("/content");
  if (c) revalidatePath(`/kunden/${c.customerId}`);
  return success("Content gelöscht");
}

/** Für einen Kunden die fehlenden Videos des Monats als Ideen-Karten anlegen */
export async function fillQuota(customerId: number, month: string, missing: number): Promise<ActionState> {
  await assertUser();
  if (missing <= 0) return success("Nichts zu tun");
  const [customer] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, customerId)).limit(1);
  const existing = await db.select({ id: contents.id }).from(contents).where(and(eq(contents.customerId, customerId), eq(contents.periodMonth, month)));
  await db.insert(contents).values(
    Array.from({ length: Math.min(missing, 20) }, (_, i) => ({
      customerId,
      title: `Video ${existing.length + i + 1} – ${customer?.name ?? ""}`.trim(),
      format: "reel",
      platforms: ["instagram", "tiktok"],
      status: "geplant",
      periodMonth: month,
    })),
  );
  revalidatePath("/content");
  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/");
  return success(`${missing} Video${missing === 1 ? "" : "s"} eingeplant`);
}
