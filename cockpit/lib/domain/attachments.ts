import { loadInvoiceDocument, loadQuoteDocument } from "./documents";
import { archivedInvoicePdf } from "./invoicing";
import { renderDocumentPdf } from "../pdf/document";
import { buildXRechnung } from "../pdf/xrechnung";
import { readFile } from "../storage";
import { fillTemplate, getSetting } from "../settings";
import { eur, fmtDate } from "../format";

export async function invoiceAttachments(invoiceId: number, withXml: boolean) {
  const doc = await loadInvoiceDocument(invoiceId);
  if (!doc) return [];
  const archived = await archivedInvoicePdf(invoiceId);
  const stored = archived ? await readFile(archived.id) : null;
  const pdf = stored?.data ?? (await renderDocumentPdf(doc.data));
  const base = `${doc.invoice.kind === "storno" ? "Stornorechnung" : "Rechnung"}_${doc.invoice.number ?? "Entwurf"}`;
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [
    { filename: `${base}.pdf`, content: pdf, contentType: "application/pdf" },
  ];
  if (withXml) {
    attachments.push({
      filename: `${base}_XRechnung.xml`,
      content: Buffer.from(buildXRechnung(doc.data, { customerEmail: doc.billingEmail ?? doc.email, paidCents: doc.invoice.paidTotal }), "utf8"),
      contentType: "application/xml",
    });
  }
  return attachments;
}

export async function quoteAttachments(quoteId: number) {
  const doc = await loadQuoteDocument(quoteId);
  if (!doc) return [];
  const pdf = await renderDocumentPdf(doc.data);
  return [{ filename: `Angebot_${doc.quote.number}.pdf`, content: pdf, contentType: "application/pdf" }];
}

/** Vorschlag für Empfänger, Betreff und Text einer Mail zu Rechnung/Mahnung/Angebot */
export async function mailDraft(kind: "rechnung" | "mahnung" | "angebot", id: number, senderName: string) {
  const [templates, company] = await Promise.all([getSetting("mailTemplates"), getSetting("company")]);
  const absender = [senderName, company.name].filter(Boolean).join("\n");
  if (kind === "angebot") {
    const doc = await loadQuoteDocument(id);
    if (!doc) return null;
    const vars = {
      nummer: doc.quote.number,
      firma: company.name,
      kunde: doc.customer.name,
      ansprechpartner: doc.contact?.name?.split(" ")[0] ?? "zusammen",
      betrag: eur(doc.quote.grossTotal),
      gueltig_bis: fmtDate(doc.quote.validUntil),
      datum: fmtDate(doc.quote.issueDate),
      absender,
    };
    const t = templates.angebot;
    return { to: doc.email ?? "", subject: fillTemplate(t.subject, vars), body: fillTemplate(t.body, vars) };
  }
  const doc = await loadInvoiceDocument(id);
  if (!doc) return null;
  const vars = {
    nummer: doc.invoice.number ?? "(wird beim Versand vergeben)",
    firma: company.name,
    kunde: doc.customer.name,
    ansprechpartner: doc.contact?.name?.split(" ")[0] ?? "zusammen",
    betrag: eur(doc.invoice.grossTotal),
    offen: eur(doc.invoice.grossTotal - doc.invoice.paidTotal),
    faellig: fmtDate(doc.invoice.dueDate),
    datum: fmtDate(doc.invoice.issueDate),
    absender,
  };
  const t = templates[kind];
  return { to: doc.billingEmail ?? doc.email ?? "", subject: fillTemplate(t.subject, vars), body: fillTemplate(t.body, vars) };
}
