import { getCurrentUser } from "@/lib/auth";
import { loadInvoiceDocument } from "@/lib/domain/documents";
import { archivedInvoicePdf } from "@/lib/domain/invoicing";
import { renderDocumentPdf } from "@/lib/pdf/document";
import { readFile } from "@/lib/storage";
import { fileResponse } from "@/lib/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const id = Number((await params).id);
  const download = new URL(req.url).searchParams.has("download");
  const doc = await loadInvoiceDocument(id);
  if (!doc) return new Response("Nicht gefunden", { status: 404 });
  const name = `${doc.invoice.kind === "storno" ? "Stornorechnung" : "Rechnung"}_${doc.invoice.number ?? "Entwurf"}.pdf`;
  // Festgeschriebene Rechnungen: immer das archivierte Original ausliefern
  if (doc.invoice.status !== "entwurf") {
    const archived = await archivedInvoicePdf(id);
    if (archived) {
      const stored = await readFile(archived.id);
      if (stored) return fileResponse(stored.data, name, "application/pdf", download);
    }
  }
  const pdf = await renderDocumentPdf(doc.data);
  return fileResponse(pdf, name, "application/pdf", download);
}
