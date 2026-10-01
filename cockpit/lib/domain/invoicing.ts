import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { contracts, customers, files, invoiceItems, invoices, payments } from "../db/schema";
import { getSetting } from "../settings";
import { addDays, addMonths, todayISO } from "../dates";
import { BILLING_MONTHS } from "../constants";
import { fmtDate, fmtMonth } from "../format";
import { computeTotals, type LineItem } from "./totals";
import { nextInvoiceNumber } from "./numbering";
import { loadInvoiceDocument } from "./documents";
import { logActivity } from "./activity";
import { saveFile } from "../storage";
import { renderDocumentPdf } from "../pdf/document";

/** Summen aus Positionen und Zahlungen neu berechnen, Status ableiten. */
export async function recalcInvoice(invoiceId: number) {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return;
  const sign = inv.kind === "storno" ? -1 : 1;
  // Festgeschriebene Rechnungen behalten ihre Beträge – nur Entwürfe werden neu berechnet.
  let t = { net: sign * inv.netTotal, tax: sign * inv.taxTotal, gross: sign * inv.grossTotal };
  if (inv.status === "entwurf") {
    const { kleinunternehmer } = await getSetting("invoicing");
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    t = computeTotals(items, inv.discountPercent, kleinunternehmer);
  }
  const [{ paid }] = await db
    .select({ paid: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));
  const paidTotal = Number(paid);
  const gross = sign * t.gross;
  let status = inv.status;
  let paidAt = inv.paidAt;
  if (inv.status !== "entwurf" && inv.status !== "storniert") {
    if (paidTotal >= gross && gross > 0) {
      status = "bezahlt";
      const [last] = await db.select({ date: payments.date }).from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.date)).limit(1);
      paidAt = last?.date ?? todayISO();
    } else if (paidTotal > 0) {
      status = "teilbezahlt";
      paidAt = null;
    } else {
      status = "offen";
      paidAt = null;
    }
  }
  await db
    .update(invoices)
    .set({ netTotal: sign * t.net, taxTotal: sign * t.tax, grossTotal: gross, paidTotal, status, paidAt, updatedAt: new Date().toISOString() })
    .where(eq(invoices.id, invoiceId));
}

export async function replaceInvoiceItems(invoiceId: number, items: LineItem[]) {
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  if (items.length) {
    await db.insert(invoiceItems).values(
      items.map((i, idx) => ({
        invoiceId,
        position: idx,
        title: i.title,
        description: i.description ?? null,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
      })),
    );
  }
}

/** Vergibt die fortlaufende Nummer, schreibt die Rechnung fest und archiviert das PDF (GoBD). */
export async function finalizeInvoice(invoiceId: number, userId: number): Promise<{ ok: boolean; error?: string }> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return { ok: false, error: "Rechnung nicht gefunden" };
  if (inv.status !== "entwurf") return { ok: true };
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  if (!items.length) return { ok: false, error: "Die Rechnung hat keine Positionen." };
  await recalcInvoice(invoiceId);
  const number = await nextInvoiceNumber(inv.issueDate.slice(0, 4));
  await db
    .update(invoices)
    .set({ number, status: "offen", finalizedAt: new Date().toISOString() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "entwurf")));
  await recalcInvoice(invoiceId);
  await archiveInvoicePdf(invoiceId, userId);
  await logActivity({
    customerId: inv.customerId,
    userId,
    title: `Rechnung ${number} erstellt`,
    body: inv.title,
    refType: "invoice",
    refId: invoiceId,
  });
  return { ok: true };
}

export async function archiveInvoicePdf(invoiceId: number, userId?: number) {
  const doc = await loadInvoiceDocument(invoiceId);
  if (!doc || !doc.invoice.number) return null;
  const pdf = await renderDocumentPdf({ ...doc.data, draft: false });
  return saveFile({
    data: pdf,
    name: `${doc.invoice.kind === "storno" ? "Stornorechnung" : "Rechnung"} ${doc.invoice.number} – ${doc.customer.name}.pdf`,
    mimeType: "application/pdf",
    customerId: doc.invoice.customerId,
    category: "rechnung",
    refType: "invoice",
    refId: invoiceId,
    uploadedBy: userId ?? null,
  });
}

export async function archivedInvoicePdf(invoiceId: number) {
  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.refType, "invoice"), eq(files.refId, invoiceId)))
    .orderBy(asc(files.createdAt))
    .limit(1);
  return file ?? null;
}

/** Storno: Gegenrechnung mit negativen Beträgen, Original wird als storniert markiert. */
export async function cancelInvoice(invoiceId: number, userId: number): Promise<{ ok: boolean; error?: string; stornoId?: number }> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv || !inv.number) return { ok: false, error: "Nur festgeschriebene Rechnungen können storniert werden." };
  if (inv.status === "storniert") return { ok: false, error: "Bereits storniert." };
  if (inv.kind === "storno") return { ok: false, error: "Stornorechnungen können nicht storniert werden." };
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  const today = todayISO();
  const [storno] = await db
    .insert(invoices)
    .values({
      kind: "storno",
      customerId: inv.customerId,
      contractId: inv.contractId,
      cancelsInvoiceId: inv.id,
      title: `Storno zu ${inv.number}: ${inv.title}`,
      status: "entwurf",
      issueDate: today,
      serviceFrom: inv.serviceFrom,
      serviceTo: inv.serviceTo,
      dueDate: today,
      intro: null,
      outro: null,
      discountPercent: inv.discountPercent,
      createdBy: userId,
    })
    .returning();
  await replaceInvoiceItems(
    storno.id,
    items.map((i) => ({ ...i, optional: false })),
  );
  await recalcInvoice(storno.id);
  const number = await nextInvoiceNumber(today.slice(0, 4));
  await db.update(invoices).set({ number, status: "storniert", finalizedAt: new Date().toISOString() }).where(eq(invoices.id, storno.id));
  await db.update(invoices).set({ status: "storniert" }).where(eq(invoices.id, inv.id));
  await archiveInvoicePdf(storno.id, userId);
  await logActivity({ customerId: inv.customerId, userId, title: `Rechnung ${inv.number} storniert`, body: `Stornorechnung ${number}`, refType: "invoice", refId: storno.id });
  return { ok: true, stornoId: storno.id };
}

/**
 * Serienrechnungen: Für Verträge mit automatischer Abrechnung, deren nächster
 * Rechnungstermin erreicht ist, werden Rechnungsentwürfe angelegt.
 */
export async function generateRecurringInvoices(userId?: number): Promise<number> {
  const today = todayISO();
  const [invoicing, due] = await Promise.all([
    getSetting("invoicing"),
    db
      .select({ contract: contracts, customer: customers })
      .from(contracts)
      .innerJoin(customers, eq(customers.id, contracts.customerId))
      .where(and(eq(contracts.autoInvoice, true), inArray(contracts.status, ["aktiv", "gekuendigt"]), lte(contracts.nextInvoiceDate, today))),
  ]);
  let created = 0;
  for (const { contract, customer } of due) {
    const months = BILLING_MONTHS[contract.billingInterval] ?? 1;
    let next = contract.nextInvoiceDate!;
    let guard = 0;
    while (next <= today && guard++ < 24) {
      if (contract.endDate && next > contract.endDate) break;
      const isOneOff = months === 0;
      const periodEnd = isOneOff ? next : addDays(addMonths(next, months), -1);
      const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(invoices).where(eq(invoices.contractId, contract.id));
      const items: LineItem[] = [];
      const periodLabel = months === 1 ? fmtMonth(next.slice(0, 7)) : `${fmtDate(next)} – ${fmtDate(periodEnd)}`;
      if (contract.monthlyFee > 0) {
        items.push({
          title: contract.title,
          description: `Leistungszeitraum ${periodLabel}${contract.services.length ? `\nEnthalten: ${contract.services.join(", ")}` : ""}`,
          quantity: Math.max(months, 1),
          unit: "Monat",
          unitPrice: contract.monthlyFee,
          taxRate: invoicing.kleinunternehmer ? 0 : invoicing.defaultTaxRate,
        });
      }
      if (Number(n) === 0 && contract.setupFee > 0) {
        items.push({ title: "Einrichtung / Onboarding", description: null, quantity: 1, unit: "Pauschale", unitPrice: contract.setupFee, taxRate: invoicing.kleinunternehmer ? 0 : invoicing.defaultTaxRate });
      }
      if (items.length) {
        const [inv] = await db
          .insert(invoices)
          .values({
            customerId: customer.id,
            contractId: contract.id,
            title: `${contract.title} – ${periodLabel}`,
            status: "entwurf",
            issueDate: next < today ? today : next,
            serviceFrom: next,
            serviceTo: periodEnd,
            dueDate: addDays(next < today ? today : next, customer.paymentTermDays ?? invoicing.paymentTermDays),
            intro: invoicing.invoiceIntro,
            outro: invoicing.invoiceOutro,
            createdBy: userId ?? null,
          })
          .returning();
        await replaceInvoiceItems(inv.id, items);
        await recalcInvoice(inv.id);
        await logActivity({ customerId: customer.id, userId, title: `Serienrechnung vorbereitet (${periodLabel})`, refType: "invoice", refId: inv.id });
        created++;
      }
      if (isOneOff) {
        next = "9999-12-31";
        await db.update(contracts).set({ autoInvoice: false }).where(eq(contracts.id, contract.id));
        break;
      }
      next = addMonths(next, months);
    }
    if (next !== "9999-12-31") await db.update(contracts).set({ nextInvoiceDate: next }).where(eq(contracts.id, contract.id));
  }
  return created;
}
