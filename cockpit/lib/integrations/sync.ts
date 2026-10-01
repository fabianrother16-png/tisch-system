import { and, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "../db";
import { customers, integrations } from "../db/schema";
import { providerInfo } from "./config";
import { extraSecrets } from "./config";
import { syncIntegration, syncPlaces } from "./providers";

export type SyncResult = { label: string; ok: boolean; message: string };

export async function syncCustomer(customerId: number, days = 30): Promise<SyncResult[]> {
  const rows = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.customerId, customerId), ne(integrations.status, "getrennt")));
  const results: SyncResult[] = [];
  for (const row of rows) {
    const label = providerInfo(row.provider)?.label ?? row.provider;
    try {
      const message = await syncIntegration(row, days);
      await db
        .update(integrations)
        .set({ status: "aktiv", lastSyncAt: new Date().toISOString(), lastError: null })
        .where(eq(integrations.id, row.id));
      results.push({ label, ok: true, message });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.update(integrations).set({ status: "fehler", lastError: message.slice(0, 500) }).where(eq(integrations.id, row.id));
      results.push({ label, ok: false, message });
    }
  }
  const [customer] = await db.select({ placeId: customers.googlePlaceId }).from(customers).where(eq(customers.id, customerId)).limit(1);
  const hasBusiness = rows.some((r) => r.provider === "google_business" && r.status === "aktiv");
  if (customer?.placeId && !hasBusiness && (await extraSecrets()).googlePlacesKey) {
    try {
      results.push({ label: "Google-Bewertungen", ok: true, message: await syncPlaces(customerId, customer.placeId) });
    } catch (err) {
      results.push({ label: "Google-Bewertungen", ok: false, message: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

export async function syncAllCustomers(days = 3) {
  const withIntegrations = await db.selectDistinct({ id: integrations.customerId }).from(integrations).where(ne(integrations.status, "getrennt"));
  const withPlace = await db.select({ id: customers.id }).from(customers).where(and(isNotNull(customers.googlePlaceId), ne(customers.status, "ehemalig")));
  const ids = [...new Set([...withIntegrations.map((r) => r.id), ...withPlace.map((r) => r.id)])];
  const all: Record<number, SyncResult[]> = {};
  for (const id of ids) all[id] = await syncCustomer(id, days);
  return all;
}
