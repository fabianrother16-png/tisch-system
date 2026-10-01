import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../db";
import { contents, contracts, customers, events } from "../db/schema";
import { DELIVERED_STATUS, IN_PROGRESS_STATUS, VIDEO_FORMATS, VISIT_EVENT_TYPES } from "../constants";
import { endOfMonth, nowLocal } from "../dates";

export type QuotaRow = {
  customerId: number;
  customerName: string;
  customerColor: string;
  videos: { target: number; delivered: number; inProgress: number; ideas: number; missing: number };
  posts: { target: number; delivered: number; inProgress: number; missing: number };
  visits: { target: number; done: number; planned: number; missing: number };
};

/**
 * Soll/Ist pro Kunde für einen Monat: Videos, Beiträge und Vor-Ort-Termine
 * laut aktiven Verträgen vs. tatsächlich produzierter Content und Termine.
 */
export async function getMonthlyQuota(month: string, customerId?: number): Promise<QuotaRow[]> {
  const monthStart = `${month}-01`;
  const monthEnd = endOfMonth(monthStart);

  const contractRows = await db
    .select({ contract: contracts, customer: customers })
    .from(contracts)
    .innerJoin(customers, eq(customers.id, contracts.customerId))
    .where(
      and(
        inArray(contracts.status, ["aktiv", "gekuendigt"]),
        lte(contracts.startDate, monthEnd),
        customerId ? eq(contracts.customerId, customerId) : undefined,
      ),
    );

  const byCustomer = new Map<number, QuotaRow>();
  for (const { contract, customer } of contractRows) {
    if (contract.endDate && contract.endDate < monthStart) continue;
    if (!contract.videosPerMonth && !contract.postsPerMonth && !contract.visitsPerMonth) continue;
    const row = byCustomer.get(customer.id) ?? {
      customerId: customer.id,
      customerName: customer.name,
      customerColor: customer.color,
      videos: { target: 0, delivered: 0, inProgress: 0, ideas: 0, missing: 0 },
      posts: { target: 0, delivered: 0, inProgress: 0, missing: 0 },
      visits: { target: 0, done: 0, planned: 0, missing: 0 },
    };
    row.videos.target += contract.videosPerMonth;
    row.posts.target += contract.postsPerMonth;
    row.visits.target += contract.visitsPerMonth;
    byCustomer.set(customer.id, row);
  }
  if (byCustomer.size === 0) return [];
  const ids = [...byCustomer.keys()];

  const contentRows = await db
    .select({ customerId: contents.customerId, format: contents.format, status: contents.status })
    .from(contents)
    .where(and(eq(contents.periodMonth, month), inArray(contents.customerId, ids)));

  for (const c of contentRows) {
    const row = byCustomer.get(c.customerId)!;
    const isVideo = VIDEO_FORMATS.includes(c.format);
    const bucket = isVideo ? row.videos : row.posts;
    if (DELIVERED_STATUS.includes(c.status)) bucket.delivered++;
    else if (IN_PROGRESS_STATUS.includes(c.status)) bucket.inProgress++;
    else if (isVideo) row.videos.ideas++;
  }

  const eventRows = await db
    .select({ customerId: events.customerId, start: events.start, type: events.type, countsAsVisit: events.countsAsVisit })
    .from(events)
    .where(and(inArray(events.customerId, ids), gte(events.start, monthStart), lte(events.start, `${monthEnd}T23:59`)));

  const now = nowLocal();
  for (const e of eventRows) {
    if (!e.customerId) continue;
    if (!e.countsAsVisit && !VISIT_EVENT_TYPES.includes(e.type)) continue;
    const row = byCustomer.get(e.customerId)!;
    if (e.start <= now) row.visits.done++;
    else row.visits.planned++;
  }

  for (const row of byCustomer.values()) {
    row.videos.missing = Math.max(0, row.videos.target - row.videos.delivered - row.videos.inProgress);
    row.posts.missing = Math.max(0, row.posts.target - row.posts.delivered - row.posts.inProgress);
    row.visits.missing = Math.max(0, row.visits.target - row.visits.done - row.visits.planned);
  }

  return [...byCustomer.values()].sort((a, b) => {
    const openA = a.videos.target - a.videos.delivered + a.visits.missing;
    const openB = b.videos.target - b.videos.delivered + b.visits.missing;
    return openB - openA || a.customerName.localeCompare(b.customerName);
  });
}
