"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { contracts, expenses, files } from "../db/schema";
import { assertUser } from "../auth";
import { optInt, str } from "../forms";
import { deleteFile, isUpload, saveUpload } from "../storage";
import { logActivity } from "../domain/activity";
import { fail, success, type ActionState } from "./types";

export async function uploadFiles(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const uploads = fd.getAll("files").filter(isUpload);
  if (!uploads.length) return fail("Bitte mindestens eine Datei auswählen.");
  const customerId = optInt(fd, "customerId");
  const category = str(fd, "category") ?? "sonstiges";
  try {
    for (const u of uploads) {
      await saveUpload(u, { customerId, category, notes: str(fd, "notes"), uploadedBy: user.id });
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Upload fehlgeschlagen");
  }
  if (customerId) {
    await logActivity({ customerId, userId: user.id, title: `${uploads.length} Datei${uploads.length === 1 ? "" : "en"} abgelegt`, body: uploads.map((u) => u.name).join(", ") });
    revalidatePath(`/kunden/${customerId}`);
  }
  revalidatePath("/ablage");
  return success(`${uploads.length} Datei${uploads.length === 1 ? "" : "en"} gespeichert`);
}

export async function updateFileMeta(fileId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const name = str(fd, "name");
  if (!name) return fail("Bitte einen Namen angeben.", { name: "Pflichtfeld" });
  await db
    .update(files)
    .set({ name, category: str(fd, "category") ?? "sonstiges", customerId: optInt(fd, "customerId"), notes: str(fd, "notes") })
    .where(eq(files.id, fileId));
  revalidatePath("/ablage");
  return success("Gespeichert");
}

export async function removeFile(fileId: number): Promise<ActionState> {
  await assertUser();
  const [f] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!f) return fail("Nicht gefunden");
  if (f.refType === "invoice") return fail("Archivierte Rechnungs-PDFs dürfen nicht gelöscht werden (Aufbewahrungspflicht 8 Jahre).");
  await db.update(expenses).set({ receiptFileId: null }).where(eq(expenses.receiptFileId, fileId));
  await db.update(contracts).set({ fileId: null }).where(eq(contracts.fileId, fileId));
  await deleteFile(fileId);
  revalidatePath("/ablage");
  if (f.customerId) revalidatePath(`/kunden/${f.customerId}`);
  return success("Datei gelöscht");
}
