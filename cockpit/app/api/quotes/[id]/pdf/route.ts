import { getCurrentUser } from "@/lib/auth";
import { loadQuoteDocument } from "@/lib/domain/documents";
import { renderDocumentPdf } from "@/lib/pdf/document";
import { fileResponse } from "@/lib/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const id = Number((await params).id);
  const doc = await loadQuoteDocument(id);
  if (!doc) return new Response("Nicht gefunden", { status: 404 });
  const pdf = await renderDocumentPdf(doc.data);
  return fileResponse(pdf, `Angebot_${doc.quote.number}.pdf`, "application/pdf", new URL(req.url).searchParams.has("download"));
}
