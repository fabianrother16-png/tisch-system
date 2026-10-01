import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { contacts, customers, invoiceItems, invoices, quoteItems, quotes } from "../db/schema";
import { getSetting } from "../settings";
import type { PdfDocumentData } from "../pdf/document";
import type { LineItem } from "./totals";

async function customerBlock(customerId: number, contactId?: number | null) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  let contact = null;
  if (contactId) [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  if (!contact) [contact] = await db.select().from(contacts).where(and(eq(contacts.customerId, customerId), eq(contacts.isPrimary, true))).limit(1);
  return {
    customer,
    contact,
    block: {
      number: customer.number,
      name: customer.name,
      contactName: contact?.name ?? null,
      street: customer.street,
      zip: customer.zip,
      city: customer.city,
      country: customer.country,
      vatId: customer.vatId,
    },
    email: customer.email ?? contact?.email ?? null,
    contactEmail: contact?.email ?? customer.email ?? null,
  };
}

export async function loadInvoiceDocument(invoiceId: number) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) return null;
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(asc(invoiceItems.position));
  const [company, invoicing, cb] = await Promise.all([getSetting("company"), getSetting("invoicing"), customerBlock(invoice.customerId)]);
  let referenceNumber: string | null = null;
  if (invoice.cancelsInvoiceId) {
    const [orig] = await db.select({ number: invoices.number }).from(invoices).where(eq(invoices.id, invoice.cancelsInvoiceId)).limit(1);
    referenceNumber = orig?.number ?? null;
  }
  const data: PdfDocumentData = {
    kind: invoice.kind === "storno" ? "storno" : "rechnung",
    number: invoice.number ?? "ENTWURF",
    title: invoice.title,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    serviceFrom: invoice.serviceFrom,
    serviceTo: invoice.serviceTo,
    referenceNumber,
    intro: invoice.intro,
    outro: invoice.outro,
    discountPercent: invoice.discountPercent,
    items: items.map(toLineItem),
    customer: cb.block,
    company,
    invoicing,
    draft: invoice.status === "entwurf",
  };
  return { invoice, items, data, customer: cb.customer, contact: cb.contact, email: cb.contactEmail, billingEmail: cb.email };
}

export async function loadQuoteDocument(quoteId: number) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote) return null;
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId)).orderBy(asc(quoteItems.position));
  const [company, invoicing, cb] = await Promise.all([getSetting("company"), getSetting("invoicing"), customerBlock(quote.customerId, quote.contactId)]);
  const data: PdfDocumentData = {
    kind: "angebot",
    number: quote.number,
    title: quote.title,
    issueDate: quote.issueDate,
    validUntil: quote.validUntil,
    intro: quote.intro,
    outro: quote.outro,
    discountPercent: quote.discountPercent,
    items: items.map(toLineItem),
    customer: cb.block,
    company,
    invoicing,
  };
  return { quote, items, data, customer: cb.customer, contact: cb.contact, email: cb.contactEmail };
}

export function toLineItem(i: {
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  optional?: boolean;
}): LineItem {
  return {
    title: i.title,
    description: i.description,
    quantity: i.quantity,
    unit: i.unit,
    unitPrice: i.unitPrice,
    taxRate: i.taxRate,
    optional: i.optional ?? false,
  };
}

export function parseItems(raw: FormDataEntryValue | null): LineItem[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((i) => ({
        title: String(i.title ?? "").trim(),
        description: i.description ? String(i.description).trim() : null,
        quantity: Number(i.quantity) || 0,
        unit: String(i.unit ?? "Pauschale"),
        unitPrice: Math.round(Number(i.unitPrice) || 0),
        taxRate: Number(i.taxRate) || 0,
        optional: !!i.optional,
      }))
      .filter((i) => i.title);
  } catch {
    return [];
  }
}
