import { getCurrentUser } from "@/lib/auth";
import { loadInvoiceDocument } from "@/lib/domain/documents";
import { buildXRechnung } from "@/lib/pdf/xrechnung";
import { fileResponse } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const id = Number((await params).id);
  const doc = await loadInvoiceDocument(id);
  if (!doc || !doc.invoice.number) return new Response("Nur für festgeschriebene Rechnungen verfügbar", { status: 404 });
  const xml = buildXRechnung(doc.data, { customerEmail: doc.billingEmail ?? doc.email, paidCents: doc.invoice.paidTotal });
  return fileResponse(Buffer.from(xml, "utf8"), `XRechnung_${doc.invoice.number}.xml`, "application/xml; charset=utf-8", true);
}
