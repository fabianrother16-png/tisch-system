import { and, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { db } from "../db";
import { customers, expenses, invoiceItems, invoices, payments } from "../db/schema";
import { getSetting } from "../settings";
import { quarterOf } from "../dates";

/*
 * Auswertungen für die Buchhaltung einer GbR (Einnahmen-Überschuss-Rechnung).
 * Grundsatz der EÜR ist das Zufluss-/Abflussprinzip: Einnahmen zählen,
 * wenn das Geld eingeht (Zahlungsdatum), Ausgaben, wenn sie bezahlt werden.
 */

type RateSplit = Map<number, number>; // Steuersatz → Anteil am Netto (0..1)

async function invoiceRateSplits(invoiceIds: number[]) {
  const map = new Map<number, RateSplit>();
  if (!invoiceIds.length) return map;
  const items = await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds));
  const totals = new Map<number, Map<number, number>>();
  for (const i of items) {
    const t = totals.get(i.invoiceId) ?? new Map<number, number>();
    t.set(i.taxRate, (t.get(i.taxRate) ?? 0) + Math.round(i.quantity * i.unitPrice));
    totals.set(i.invoiceId, t);
  }
  for (const [id, t] of totals) {
    const sum = [...t.values()].reduce((s, v) => s + v, 0) || 1;
    map.set(id, new Map([...t.entries()].map(([r, v]) => [r, v / sum])));
  }
  return map;
}

export type IncomeEntry = { date: string; month: string; customerId: number; gross: number; net: number; tax: number; byRate: { rate: number; net: number; tax: number }[]; invoiceNumber: string | null; invoiceId: number };

/** Zahlungseingänge im Zeitraum, aufgeteilt in Netto und USt (anteilig nach Rechnung). */
export async function incomeEntries(from: string, to: string): Promise<IncomeEntry[]> {
  const rows = await db
    .select({ payment: payments, invoice: invoices })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .where(and(gte(payments.date, from), lte(payments.date, to)));
  const splits = await invoiceRateSplits([...new Set(rows.map((r) => r.invoice.id))]);
  const { kleinunternehmer } = await getSetting("invoicing");
  return rows.map(({ payment, invoice }) => {
    const ratio = invoice.grossTotal ? invoice.taxTotal / invoice.grossTotal : 0;
    const tax = kleinunternehmer ? 0 : Math.round(payment.amount * ratio);
    const net = payment.amount - tax;
    const split = splits.get(invoice.id) ?? new Map([[kleinunternehmer ? 0 : 19, 1]]);
    const byRate = [...split.entries()].map(([rate, share]) => {
      const n = Math.round(net * share);
      return { rate: kleinunternehmer ? 0 : rate, net: n, tax: kleinunternehmer ? 0 : Math.round((n * rate) / 100) };
    });
    return { date: payment.date, month: payment.date.slice(0, 7), customerId: invoice.customerId, gross: payment.amount, net, tax, byRate, invoiceNumber: invoice.number, invoiceId: invoice.id };
  });
}

/** Festgeschriebene Rechnungen im Zeitraum (nach Rechnungsdatum) – für Soll-Versteuerung & Umsatzsicht. */
export async function invoicedEntries(from: string, to: string) {
  const rows = await db
    .select()
    .from(invoices)
    .where(and(ne(invoices.status, "entwurf"), gte(invoices.issueDate, from), lte(invoices.issueDate, to)));
  const splits = await invoiceRateSplits(rows.map((r) => r.id));
  const { kleinunternehmer } = await getSetting("invoicing");
  return rows.map((inv) => {
    const split = splits.get(inv.id) ?? new Map([[19, 1]]);
    const byRate = [...split.entries()].map(([rate, share]) => {
      const n = Math.round(inv.netTotal * share);
      return { rate: kleinunternehmer ? 0 : rate, net: n, tax: kleinunternehmer ? 0 : Math.round((n * rate) / 100) };
    });
    return { date: inv.issueDate, month: inv.issueDate.slice(0, 7), customerId: inv.customerId, gross: inv.grossTotal, net: inv.netTotal, tax: inv.taxTotal, byRate, invoiceNumber: inv.number, invoiceId: inv.id };
  });
}

export async function expenseEntries(from: string, to: string) {
  return db.select().from(expenses).where(and(gte(expenses.date, from), lte(expenses.date, to)));
}

export type MonthRow = { month: string; einnahmen: number; ausgaben: number; gewinn: number; ust: number; vorsteuer: number };

export async function monthlyOverview(year: string): Promise<MonthRow[]> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const [income, exp] = await Promise.all([incomeEntries(from, to), expenseEntries(from, to)]);
  return Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, "0")}`;
    const inc = income.filter((e) => e.month === month);
    const ex = exp.filter((e) => e.date.startsWith(month));
    const einnahmen = inc.reduce((s, e) => s + e.net, 0);
    const ausgaben = ex.reduce((s, e) => s + e.netAmount, 0);
    return {
      month,
      einnahmen,
      ausgaben,
      gewinn: einnahmen - ausgaben,
      ust: inc.reduce((s, e) => s + e.tax, 0),
      vorsteuer: ex.reduce((s, e) => s + e.taxAmount, 0),
    };
  });
}

export type VatPeriod = {
  key: string;
  label: string;
  base19: number;
  base7: number;
  base0: number;
  ust: number;
  vorsteuer: number;
  zahllast: number;
};

/** Umsatzsteuer-Voranmeldung (Übersicht) – Ist- oder Soll-Versteuerung laut Einstellungen. */
export async function vatReport(year: string, mode: "monat" | "quartal"): Promise<{ periods: VatPeriod[]; taxation: "ist" | "soll"; kleinunternehmer: boolean }> {
  const { taxationMode, kleinunternehmer } = await getSetting("invoicing");
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const [income, exp] = await Promise.all([
    taxationMode === "soll" ? invoicedEntries(from, to) : incomeEntries(from, to),
    expenseEntries(from, to),
  ]);
  const keyOf = (date: string) => (mode === "quartal" ? `Q${quarterOf(date)}` : date.slice(0, 7));
  const keys = mode === "quartal" ? ["Q1", "Q2", "Q3", "Q4"] : Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const periods = keys.map((key) => {
    const inc = income.filter((e) => keyOf(e.date) === key);
    const ex = exp.filter((e) => keyOf(e.date) === key);
    const rate = (r: number) => inc.reduce((s, e) => s + e.byRate.filter((b) => b.rate === r).reduce((a, b) => a + b.net, 0), 0);
    const ust = inc.reduce((s, e) => s + e.tax, 0);
    const vorsteuer = ex.reduce((s, e) => s + e.taxAmount, 0);
    return {
      key,
      label: mode === "quartal" ? `${key} ${year}` : MONTHS[Number(key.slice(5, 7)) - 1],
      base19: rate(19),
      base7: rate(7),
      base0: rate(0),
      ust,
      vorsteuer,
      zahllast: ust - vorsteuer,
    };
  });
  return { periods, taxation: taxationMode, kleinunternehmer };
}

/** Vereinfachte EÜR + Gewinnverteilung auf die Gesellschafter */
export async function euerReport(year: string) {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const [income, exp, partners] = await Promise.all([incomeEntries(from, to), expenseEntries(from, to), getSetting("partners")]);
  const einnahmenNetto = income.reduce((s, e) => s + e.net, 0);
  const ustVereinnahmt = income.reduce((s, e) => s + e.tax, 0);
  const byCategory = new Map<string, number>();
  for (const e of exp) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.netAmount);
  const ausgabenNetto = exp.reduce((s, e) => s + e.netAmount, 0);
  const vorsteuer = exp.reduce((s, e) => s + e.taxAmount, 0);
  const gewinn = einnahmenNetto - ausgabenNetto;
  const totalShare = partners.reduce((s, p) => s + p.share, 0) || 100;
  return {
    einnahmenNetto,
    ustVereinnahmt,
    ausgabenNetto,
    vorsteuer,
    gewinn,
    categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
    partners: partners.map((p) => ({ ...p, amount: Math.round((gewinn * p.share) / totalShare) })),
  };
}

/** Umsatz (bezahlt, netto) und zugeordnete Kosten je Kunde → Deckungsbeitrag */
export async function customerProfitability(from: string, to: string) {
  const [income, exp, customerRows] = await Promise.all([
    incomeEntries(from, to),
    expenseEntries(from, to),
    db.select({ id: customers.id, name: customers.name, color: customers.color }).from(customers),
  ]);
  const map = new Map<number, { id: number; name: string; color: string; umsatz: number; kosten: number }>();
  for (const c of customerRows) map.set(c.id, { ...c, umsatz: 0, kosten: 0 });
  for (const e of income) {
    const r = map.get(e.customerId);
    if (r) r.umsatz += e.net;
  }
  for (const e of exp) {
    if (!e.customerId) continue;
    const r = map.get(e.customerId);
    if (r) r.kosten += e.netAmount;
  }
  return [...map.values()]
    .filter((r) => r.umsatz || r.kosten)
    .map((r) => ({ ...r, deckungsbeitrag: r.umsatz - r.kosten, marge: r.umsatz ? ((r.umsatz - r.kosten) / r.umsatz) * 100 : null }))
    .sort((a, b) => b.umsatz - a.umsatz);
}

export async function openReceivables() {
  return db
    .select({ invoice: invoices, customer: customers })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(inArray(invoices.status, ["offen", "teilbezahlt"]));
}
