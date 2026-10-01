import { and, eq, lt } from "drizzle-orm";
import { db } from "../db";
import { quotes } from "../db/schema";
import { todayISO } from "../dates";
import { generateRecurringInvoices } from "./invoicing";
import { syncAllCustomers } from "../integrations/sync";

/** Tägliche Routine: Zahlen holen, Serienrechnungen vorbereiten, Angebote ablaufen lassen, Postfach abrufen. */
export async function runDailyMaintenance() {
  const result: Record<string, unknown> = {};
  try {
    const sync = await syncAllCustomers(3);
    result.sync = Object.values(sync).flat().map((r) => `${r.ok ? "✓" : "✗"} ${r.label}: ${r.message}`);
  } catch (err) {
    result.sync = String(err);
  }
  try {
    result.recurringInvoices = await generateRecurringInvoices();
  } catch (err) {
    result.recurringInvoices = String(err);
  }
  const expired = await db
    .update(quotes)
    .set({ status: "abgelaufen" })
    .where(and(eq(quotes.status, "versendet"), lt(quotes.validUntil, todayISO())))
    .returning({ id: quotes.id });
  result.expiredQuotes = expired.length;
  try {
    const { fetchInbox } = await import("../inbox");
    result.mail = await fetchInbox();
  } catch (err) {
    result.mail = String(err instanceof Error ? err.message : err);
  }
  return result;
}
