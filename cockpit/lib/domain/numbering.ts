import { like, sql } from "drizzle-orm";
import { db } from "../db";
import { customers, invoices, quotes } from "../db/schema";
import { getSetting } from "../settings";

function nextSeq(existing: (string | null)[], prefix: string): number {
  let max = 0;
  for (const n of existing) {
    if (!n || !n.startsWith(prefix)) continue;
    const seq = Number(n.slice(prefix.length));
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max + 1;
}

export async function nextCustomerNumber(): Promise<string> {
  const { customerPrefix } = await getSetting("invoicing");
  const prefix = `${customerPrefix || "K"}-`;
  const rows = await db.select({ n: customers.number }).from(customers).where(like(customers.number, `${prefix}%`));
  const seq = Math.max(nextSeq(rows.map((r) => r.n), prefix), 1001);
  return `${prefix}${seq}`;
}

export async function nextQuoteNumber(year: string): Promise<string> {
  const { quotePrefix } = await getSetting("invoicing");
  const prefix = `${quotePrefix || "AN"}-${year}-`;
  const rows = await db.select({ n: quotes.number }).from(quotes).where(like(quotes.number, `${prefix}%`));
  return `${prefix}${String(nextSeq(rows.map((r) => r.n), prefix)).padStart(4, "0")}`;
}

/** Fortlaufende, lückenlose Rechnungsnummer – wird erst beim Festschreiben vergeben. */
export async function nextInvoiceNumber(year: string): Promise<string> {
  const { invoicePrefix } = await getSetting("invoicing");
  const prefix = `${invoicePrefix || "RE"}-${year}-`;
  const rows = await db
    .select({ n: invoices.number })
    .from(invoices)
    .where(sql`${invoices.number} like ${prefix + "%"}`);
  return `${prefix}${String(nextSeq(rows.map((r) => r.n), prefix)).padStart(4, "0")}`;
}
