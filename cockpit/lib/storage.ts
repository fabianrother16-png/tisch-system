import { eq } from "drizzle-orm";
import { db } from "./db";
import { fileBlobs, files, type StoredFile } from "./db/schema";
import { randomToken } from "./crypto";

/*
 * Dateien werden direkt in der Datenbank abgelegt. Das funktioniert lokal
 * und online (Turso) ohne zusätzlichen Speicherdienst. Für sehr große
 * Medien (Rohvideos) ist eine Cloud-Ablage wie Google Drive besser geeignet.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function saveFile(input: {
  data: Buffer;
  name: string;
  mimeType: string;
  customerId?: number | null;
  category?: string;
  refType?: string;
  refId?: number;
  notes?: string | null;
  uploadedBy?: number | null;
}): Promise<StoredFile> {
  const key = randomToken(18);
  await db.insert(fileBlobs).values({ key, data: input.data });
  const [file] = await db
    .insert(files)
    .values({
      name: input.name,
      mimeType: input.mimeType || "application/octet-stream",
      size: input.data.length,
      storageKey: key,
      customerId: input.customerId ?? null,
      category: input.category ?? "sonstiges",
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      notes: input.notes ?? null,
      uploadedBy: input.uploadedBy ?? null,
    })
    .returning();
  return file;
}

export async function saveUpload(
  upload: File,
  meta: Omit<Parameters<typeof saveFile>[0], "data" | "name" | "mimeType">,
): Promise<StoredFile> {
  if (upload.size > MAX_UPLOAD_BYTES) throw new Error("Datei ist größer als 10 MB.");
  const data = Buffer.from(await upload.arrayBuffer());
  return saveFile({ ...meta, data, name: upload.name || "Datei", mimeType: upload.type });
}

export async function readFile(id: number): Promise<{ file: StoredFile; data: Buffer } | null> {
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return null;
  const [blob] = await db.select().from(fileBlobs).where(eq(fileBlobs.key, file.storageKey)).limit(1);
  if (!blob) return null;
  return { file, data: Buffer.from(blob.data) };
}

export async function deleteFile(id: number): Promise<void> {
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return;
  await db.delete(fileBlobs).where(eq(fileBlobs.key, file.storageKey));
  await db.delete(files).where(eq(files.id, id));
}

export function isUpload(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && (value as File).size > 0;
}
