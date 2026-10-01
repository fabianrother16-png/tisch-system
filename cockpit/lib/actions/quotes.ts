"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { contracts, invoices, quoteItems, quotes } from "../db/schema";
import { assertUser } from "../auth";
import { isDate, optInt, str } from "../forms";
import { addDays, todayISO } from "../dates";
import { parseNumber } from "../format";
import { getSetting } from "../settings";
import { computeTotals, type LineItem } from "../domain/totals";
import { nextQuoteNumber } from "../domain/numbering";
import { parseItems } from "../domain/documents";
import { recalcInvoice, replaceInvoiceItems } from "../domain/invoicing";
import { logActivity } from "../domain/activity";
import { quoteAttachments } from "../domain/attachments";
import { sendMail } from "../mail";
import { saveFile } from "../storage";
import { renderDocumentPdf } from "../pdf/document";
import { loadQuoteDocument } from "../domain/documents";
import { fail, success, type ActionState } from "./types";

function revalidateQuote(id: number, customerId?: number) {
  revalidatePath("/angebote");
  revalidatePath(`/angebote/${id}`);
  revalidatePath("/");
  if (customerId) revalidatePath(`/kunden/${customerId}`);
}

async function replaceQuoteItems(quoteId: number, items: LineItem[]) {
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  if (items.length) {
    await db.insert(quoteItems).values(
      items.map((i, idx) => ({
        quoteId,
        position: idx,
        title: i.title,
        description: i.description ?? null,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        optional: !!i.optional,
      })),
    );
  }
}

async function recalcQuote(quoteId: number) {
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  const { kleinunternehmer } = await getSetting("invoicing");
  const t = computeTotals(items, q.discountPercent, kleinunternehmer);
  await db.update(quotes).set({ netTotal: t.net, taxTotal: t.tax, grossTotal: t.gross }).where(eq(quotes.id, quoteId));
}

export async function saveQuote(quoteId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const customerId = optInt(fd, "customerId");
  const title = str(fd, "title");
  const issueDate = str(fd, "issueDate");
  const items = parseItems(fd.get("items"));
  const errors: Record<string, string> = {};
  if (!customerId) errors.customerId = "Bitte Kunden wählen";
  if (!title) errors.title = "Bitte einen Betreff angeben";
  if (!isDate(issueDate)) errors.issueDate = "Bitte ein Datum angeben";
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);
  if (!items.length) return fail("Bitte mindestens eine Position mit Bezeichnung anlegen.");

  const values = {
    customerId: customerId!,
    title: title!,
    issueDate: issueDate!,
    validUntil: str(fd, "validUntil"),
    intro: str(fd, "intro"),
    outro: str(fd, "outro"),
    discountPercent: Math.min(100, Math.max(0, parseNumber(fd.get("discountPercent") as string, 0))),
    updatedAt: new Date().toISOString(),
  };
  let id = quoteId;
  if (quoteId) {
    const [existing] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
    if (!existing) return fail("Angebot nicht gefunden");
    if (existing.status === "angenommen") return fail("Angenommene Angebote können nicht mehr geändert werden.");
    await db.update(quotes).set(values).where(eq(quotes.id, quoteId));
  } else {
    const [created] = await db
      .insert(quotes)
      .values({ ...values, number: await nextQuoteNumber(issueDate!.slice(0, 4)), status: "entwurf", createdBy: user.id })
      .returning();
    id = created.id;
    await logActivity({ customerId: values.customerId, userId: user.id, title: `Angebot ${created.number} erstellt`, body: values.title, refType: "quote", refId: id });
  }
  await replaceQuoteItems(id!, items);
  await recalcQuote(id!);
  revalidateQuote(id!, values.customerId);
  return success(quoteId ? "Angebot gespeichert" : "Angebot angelegt", { redirectTo: `/angebote/${id}` });
}

export async function setQuoteStatus(quoteId: number, status: "entwurf" | "versendet" | "angenommen" | "abgelehnt" | "abgelaufen"): Promise<ActionState> {
  const user = await assertUser();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!q) return fail("Nicht gefunden");
  await db
    .update(quotes)
    .set({
      status,
      decidedAt: status === "angenommen" || status === "abgelehnt" ? todayISO() : q.decidedAt,
      sentAt: status === "versendet" && !q.sentAt ? new Date().toISOString() : q.sentAt,
    })
    .where(eq(quotes.id, quoteId));
  const labels: Record<string, string> = { angenommen: "angenommen 🎉", abgelehnt: "abgelehnt", versendet: "als versendet markiert", abgelaufen: "abgelaufen", entwurf: "zurück auf Entwurf" };
  await logActivity({ customerId: q.customerId, userId: user.id, title: `Angebot ${q.number} ${labels[status]}`, refType: "quote", refId: quoteId });
  if (status === "angenommen") {
    // Archivkopie des angenommenen Angebots in der Ablage
    const doc = await loadQuoteDocument(quoteId);
    if (doc) {
      const pdf = await renderDocumentPdf(doc.data);
      await saveFile({ data: pdf, name: `Angebot ${q.number} – ${doc.customer.name} (angenommen).pdf`, mimeType: "application/pdf", customerId: q.customerId, category: "angebot", refType: "quote", refId: quoteId, uploadedBy: user.id });
    }
  }
  revalidateQuote(quoteId, q.customerId);
  return success(`Angebot ${labels[status]}`);
}

export async function sendQuoteMail(quoteId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const to = str(fd, "to");
  if (!to) return fail("Bitte Empfänger angeben.", { to: "Pflichtfeld" });
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!q) return fail("Nicht gefunden");
  const res = await sendMail({
    to,
    cc: str(fd, "cc"),
    subject: str(fd, "subject") ?? `Angebot ${q.number}`,
    text: str(fd, "body") ?? "",
    attachments: await quoteAttachments(quoteId),
    customerId: q.customerId,
    refType: "quote",
    refId: quoteId,
    userId: user.id,
  });
  if (!res.ok) return fail(res.error ?? "Versand fehlgeschlagen");
  await db
    .update(quotes)
    .set({ status: q.status === "entwurf" ? "versendet" : q.status, sentAt: new Date().toISOString() })
    .where(eq(quotes.id, quoteId));
  await logActivity({ customerId: q.customerId, userId: user.id, kind: "email", title: `Angebot ${q.number} per E-Mail versendet`, body: `an ${to}`, refType: "quote", refId: quoteId });
  revalidateQuote(quoteId, q.customerId);
  return success(`Angebot an ${to} gesendet`);
}

export async function quoteToInvoice(quoteId: number): Promise<ActionState> {
  const user = await assertUser();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!q) return fail("Nicht gefunden");
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId)).orderBy(asc(quoteItems.position));
  const invoicing = await getSetting("invoicing");
  const today = todayISO();
  const [inv] = await db
    .insert(invoices)
    .values({
      customerId: q.customerId,
      quoteId: q.id,
      title: q.title,
      status: "entwurf",
      issueDate: today,
      serviceFrom: today,
      serviceTo: today,
      dueDate: addDays(today, invoicing.paymentTermDays),
      intro: invoicing.invoiceIntro,
      outro: invoicing.invoiceOutro,
      discountPercent: q.discountPercent,
      createdBy: user.id,
    })
    .returning();
  await replaceInvoiceItems(
    inv.id,
    items.filter((i) => !i.optional),
  );
  await recalcInvoice(inv.id);
  await db.update(quotes).set({ invoiceId: inv.id, status: q.status === "angenommen" ? q.status : "angenommen", decidedAt: q.decidedAt ?? today }).where(eq(quotes.id, quoteId));
  revalidateQuote(quoteId, q.customerId);
  return success("Rechnungsentwurf aus Angebot erstellt", { redirectTo: `/rechnungen/${inv.id}?bearbeiten=1` });
}

/** Aus einem angenommenen Angebot einen Vertragsentwurf erzeugen (monatliche Positionen → Vergütung). */
export async function quoteToContract(quoteId: number): Promise<ActionState> {
  const user = await assertUser();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!q) return fail("Nicht gefunden");
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  const monthly = items.filter((i) => !i.optional && i.unit === "Monat").reduce((s, i) => s + Math.round(i.unitPrice * (i.quantity >= 1 ? 1 : i.quantity)), 0);
  const once = items.filter((i) => !i.optional && i.unit !== "Monat").reduce((s, i) => s + Math.round(i.quantity * i.unitPrice), 0);
  const [c] = await db
    .insert(contracts)
    .values({
      customerId: q.customerId,
      title: q.title,
      status: "entwurf",
      startDate: todayISO(),
      minTermMonths: 6,
      noticePeriod: 1,
      noticeUnit: "monate",
      autoRenewMonths: 3,
      monthlyFee: monthly,
      setupFee: once,
      services: items.filter((i) => !i.optional).map((i) => i.title),
      notes: `Erstellt aus Angebot ${q.number}`,
    })
    .returning();
  await db.update(quotes).set({ contractId: c.id }).where(eq(quotes.id, quoteId));
  await logActivity({ customerId: q.customerId, userId: user.id, title: `Vertragsentwurf aus Angebot ${q.number} erstellt`, refType: "contract", refId: c.id });
  revalidateQuote(quoteId, q.customerId);
  return success("Vertragsentwurf angelegt – bitte Laufzeit & Umfang prüfen", { redirectTo: `/kunden/${q.customerId}?tab=vertraege` });
}

export async function duplicateQuote(quoteId: number): Promise<ActionState> {
  const user = await assertUser();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!q) return fail("Nicht gefunden");
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId)).orderBy(asc(quoteItems.position));
  const today = todayISO();
  const { quoteValidityDays } = await getSetting("invoicing");
  const [created] = await db
    .insert(quotes)
    .values({
      number: await nextQuoteNumber(today.slice(0, 4)),
      customerId: q.customerId,
      title: q.title,
      status: "entwurf",
      issueDate: today,
      validUntil: addDays(today, quoteValidityDays),
      intro: q.intro,
      outro: q.outro,
      discountPercent: q.discountPercent,
      createdBy: user.id,
    })
    .returning();
  await replaceQuoteItems(created.id, items);
  await recalcQuote(created.id);
  revalidateQuote(created.id, q.customerId);
  return success("Kopie angelegt", { redirectTo: `/angebote/${created.id}?bearbeiten=1` });
}

export async function deleteQuote(quoteId: number): Promise<ActionState> {
  await assertUser();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!q) return fail("Nicht gefunden");
  if (q.status === "angenommen") return fail("Angenommene Angebote bleiben zur Dokumentation erhalten.");
  await db.delete(quotes).where(eq(quotes.id, quoteId));
  revalidateQuote(quoteId, q.customerId);
  return success("Angebot gelöscht", { redirectTo: "/angebote" });
}
