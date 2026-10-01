import { getCurrentUser } from "@/lib/auth";
import { readFile } from "@/lib/storage";
import { fileResponse } from "@/lib/http";

const INLINE = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "text/plain", "video/mp4"];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const id = Number((await params).id);
  const stored = await readFile(id);
  if (!stored) return new Response("Nicht gefunden", { status: 404 });
  const download = new URL(req.url).searchParams.has("download") || !INLINE.includes(stored.file.mimeType);
  return fileResponse(stored.data, stored.file.name, stored.file.mimeType, download);
}
