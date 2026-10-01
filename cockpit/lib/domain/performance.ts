import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { adCampaigns, adStatsDaily, baselines, linkClicks, metricsDaily, posts, trackingLinks } from "../db/schema";
import { addDays, addMonthKey, endOfMonth, monthKey, monthsBetween, todayISO } from "../dates";
import { ACCOUNT_METRICS, metricKind } from "../constants";

export type Range = { from: string; to: string };

export const RANGE_OPTIONS = [
  { key: "30", label: "30 Tage", days: 30 },
  { key: "90", label: "90 Tage", days: 90 },
  { key: "180", label: "6 Monate", days: 182 },
  { key: "365", label: "12 Monate", days: 365 },
];

export function resolveRange(key: string | undefined): Range & { key: string; days: number } {
  const opt = RANGE_OPTIONS.find((o) => o.key === key) ?? RANGE_OPTIONS[1];
  const to = todayISO();
  return { key: opt.key, days: opt.days, from: addDays(to, -opt.days + 1), to };
}

export function previousRange(r: Range & { days: number }): Range {
  return { from: addDays(r.from, -r.days), to: addDays(r.from, -1) };
}

// ─── Konto-Kennzahlen ──────────────────────────────────────────────────────

export async function latestMetric(customerId: number, platform: string, metric: string, onOrBefore?: string) {
  const [row] = await db
    .select({ value: metricsDaily.value, date: metricsDaily.date })
    .from(metricsDaily)
    .where(
      and(
        eq(metricsDaily.customerId, customerId),
        eq(metricsDaily.platform, platform),
        eq(metricsDaily.metric, metric),
        onOrBefore ? lte(metricsDaily.date, onOrBefore) : undefined,
      ),
    )
    .orderBy(desc(metricsDaily.date))
    .limit(1);
  return row ?? null;
}

export async function sumMetric(customerId: number, platform: string, metric: string, range: Range): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${metricsDaily.value}), 0)` })
    .from(metricsDaily)
    .where(
      and(
        eq(metricsDaily.customerId, customerId),
        eq(metricsDaily.platform, platform),
        eq(metricsDaily.metric, metric),
        gte(metricsDaily.date, range.from),
        lte(metricsDaily.date, range.to),
      ),
    );
  return Number(row?.total ?? 0);
}

export async function metricSeries(customerId: number, platform: string, metric: string, range: Range) {
  return db
    .select({ date: metricsDaily.date, value: metricsDaily.value })
    .from(metricsDaily)
    .where(
      and(
        eq(metricsDaily.customerId, customerId),
        eq(metricsDaily.platform, platform),
        eq(metricsDaily.metric, metric),
        gte(metricsDaily.date, range.from),
        lte(metricsDaily.date, range.to),
      ),
    )
    .orderBy(asc(metricsDaily.date));
}

/** Monatswerte einer Kennzahl: Bestand = letzter Wert im Monat, Zeitraum = Summe */
export async function metricByMonth(customerId: number, platform: string, metric: string, months: string[]) {
  if (!months.length) return [];
  const range = { from: `${months[0]}-01`, to: endOfMonth(`${months[months.length - 1]}-01`) };
  const rows = await metricSeries(customerId, platform, metric, range);
  const kind = metricKind(platform, metric);
  const map = new Map<string, number>();
  for (const r of rows) {
    const m = monthKey(r.date);
    if (kind === "bestand") map.set(m, r.value);
    else map.set(m, (map.get(m) ?? 0) + r.value);
  }
  return months.map((m) => ({ month: m, value: map.has(m) ? map.get(m)! : null }));
}

/** Welche Konto-Kennzahlen gibt es für den Kunden überhaupt? */
export async function availableMetrics(customerId: number) {
  const rows = await db
    .selectDistinct({ platform: metricsDaily.platform, metric: metricsDaily.metric })
    .from(metricsDaily)
    .where(eq(metricsDaily.customerId, customerId));
  const order = ACCOUNT_METRICS.map((m) => `${m.platform}:${m.metric}`);
  return rows.sort((a, b) => order.indexOf(`${a.platform}:${a.metric}`) - order.indexOf(`${b.platform}:${b.metric}`));
}

// ─── Beiträge ──────────────────────────────────────────────────────────────

export async function postsInRange(customerId: number | number[] | null, range: Range, platform?: string) {
  const ids = customerId == null ? null : Array.isArray(customerId) ? customerId : [customerId];
  return db
    .select()
    .from(posts)
    .where(
      and(
        ids ? inArray(posts.customerId, ids) : undefined,
        gte(posts.publishedAt, range.from),
        lte(posts.publishedAt, `${range.to}T23:59:59`),
        platform ? eq(posts.platform, platform) : undefined,
      ),
    )
    .orderBy(desc(posts.publishedAt));
}

export function postTotals(list: { views: number; likes: number; comments: number; shares: number; saves: number; reach: number }[]) {
  const t = list.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      shares: acc.shares + p.shares,
      saves: acc.saves + p.saves,
      reach: acc.reach + p.reach,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0 },
  );
  const interactions = t.likes + t.comments + t.shares + t.saves;
  return { ...t, count: list.length, interactions, engagementRate: t.views ? (interactions / t.views) * 100 : null, avgViews: list.length ? t.views / list.length : 0 };
}

/** Aufrufe der im jeweiligen Monat veröffentlichten Beiträge, je Plattform */
export async function viewsByMonth(customerId: number | null, months: string[]) {
  if (!months.length) return [];
  const range = { from: `${months[0]}-01`, to: endOfMonth(`${months[months.length - 1]}-01`) };
  const rows = await db
    .select({
      month: sql<string>`substr(${posts.publishedAt}, 1, 7)`,
      platform: posts.platform,
      views: sql<number>`sum(${posts.views})`,
      interactions: sql<number>`sum(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`,
      count: sql<number>`count(*)`,
    })
    .from(posts)
    .where(
      and(
        customerId ? eq(posts.customerId, customerId) : undefined,
        gte(posts.publishedAt, range.from),
        lte(posts.publishedAt, `${range.to}T23:59:59`),
      ),
    )
    .groupBy(sql`substr(${posts.publishedAt}, 1, 7)`, posts.platform);
  return months.map((m) => {
    const entry: Record<string, number | string> = { month: m, total: 0, interactions: 0, count: 0 };
    for (const r of rows.filter((x) => x.month === m)) {
      entry[r.platform] = Number(r.views);
      entry.total = (entry.total as number) + Number(r.views);
      entry.interactions = (entry.interactions as number) + Number(r.interactions);
      entry.count = (entry.count as number) + Number(r.count);
    }
    return entry;
  });
}

// ─── Werbung ───────────────────────────────────────────────────────────────

export async function adTotals(customerId: number | null, range: Range) {
  const [row] = await db
    .select({
      spend: sql<number>`coalesce(sum(${adStatsDaily.spend}), 0)`,
      impressions: sql<number>`coalesce(sum(${adStatsDaily.impressions}), 0)`,
      clicks: sql<number>`coalesce(sum(${adStatsDaily.clicks}), 0)`,
      reach: sql<number>`coalesce(sum(${adStatsDaily.reach}), 0)`,
      conversions: sql<number>`coalesce(sum(${adStatsDaily.conversions}), 0)`,
      conversionValue: sql<number>`coalesce(sum(${adStatsDaily.conversionValue}), 0)`,
    })
    .from(adStatsDaily)
    .innerJoin(adCampaigns, eq(adCampaigns.id, adStatsDaily.campaignId))
    .where(
      and(
        customerId ? eq(adCampaigns.customerId, customerId) : undefined,
        gte(adStatsDaily.date, range.from),
        lte(adStatsDaily.date, range.to),
      ),
    );
  const t = {
    spend: Number(row.spend),
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    reach: Number(row.reach),
    conversions: Number(row.conversions),
    conversionValue: Number(row.conversionValue),
  };
  return {
    ...t,
    ctr: t.impressions ? (t.clicks / t.impressions) * 100 : null,
    cpc: t.clicks ? t.spend / t.clicks : null,
    cpm: t.impressions ? (t.spend / t.impressions) * 1000 : null,
    cpa: t.conversions ? t.spend / t.conversions : null,
    roas: t.spend ? t.conversionValue / t.spend : null,
  };
}

export async function adDaily(customerId: number, range: Range) {
  return db
    .select({
      date: adStatsDaily.date,
      platform: adCampaigns.platform,
      spend: sql<number>`sum(${adStatsDaily.spend})`,
      clicks: sql<number>`sum(${adStatsDaily.clicks})`,
      impressions: sql<number>`sum(${adStatsDaily.impressions})`,
      conversions: sql<number>`sum(${adStatsDaily.conversions})`,
    })
    .from(adStatsDaily)
    .innerJoin(adCampaigns, eq(adCampaigns.id, adStatsDaily.campaignId))
    .where(and(eq(adCampaigns.customerId, customerId), gte(adStatsDaily.date, range.from), lte(adStatsDaily.date, range.to)))
    .groupBy(adStatsDaily.date, adCampaigns.platform)
    .orderBy(asc(adStatsDaily.date));
}

// ─── Tracking-Links ────────────────────────────────────────────────────────

export async function linkClicksInRange(customerId: number | null, range: Range) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(linkClicks)
    .innerJoin(trackingLinks, eq(trackingLinks.id, linkClicks.linkId))
    .where(
      and(
        customerId ? eq(trackingLinks.customerId, customerId) : undefined,
        gte(linkClicks.date, range.from),
        lte(linkClicks.date, range.to),
      ),
    );
  return Number(row?.n ?? 0);
}

export async function linkClicksByDay(customerId: number, range: Range) {
  return db
    .select({ date: linkClicks.date, n: sql<number>`count(*)` })
    .from(linkClicks)
    .innerJoin(trackingLinks, eq(trackingLinks.id, linkClicks.linkId))
    .where(and(eq(trackingLinks.customerId, customerId), gte(linkClicks.date, range.from), lte(linkClicks.date, range.to)))
    .groupBy(linkClicks.date)
    .orderBy(asc(linkClicks.date));
}

// ─── Kompaktübersicht & Vorher/Nachher ────────────────────────────────────

export type SnapshotItem = {
  platform: string;
  metric: string;
  label: string;
  value: number;
  previous: number | null;
  baseline: number | null;
  format: "number" | "rating" | "money";
};

/** Die wichtigsten Zahlen eines Kunden mit Vergleich zu vor 30 Tagen und zum Ausgangswert. */
export async function getCustomerSnapshot(customerId: number): Promise<SnapshotItem[]> {
  const today = todayISO();
  const range = { from: addDays(today, -29), to: today };
  const prev = { from: addDays(today, -59), to: addDays(today, -30) };
  const baseRows = await db.select().from(baselines).where(eq(baselines.customerId, customerId));
  const base = (p: string, m: string) => baseRows.find((b) => b.platform === p && b.metric === m)?.value ?? null;

  const items: SnapshotItem[] = [];
  for (const [platform, label] of [
    ["instagram", "Instagram-Follower"],
    ["tiktok", "TikTok-Follower"],
    ["facebook", "Facebook-Follower"],
  ] as const) {
    const latest = await latestMetric(customerId, platform, "followers");
    if (!latest) continue;
    const before = await latestMetric(customerId, platform, "followers", addDays(today, -30));
    items.push({ platform, metric: "followers", label, value: latest.value, previous: before?.value ?? null, baseline: base(platform, "followers"), format: "number" });
  }
  const rating = await latestMetric(customerId, "google", "rating");
  if (rating) {
    const before = await latestMetric(customerId, "google", "rating", addDays(today, -30));
    items.push({ platform: "google", metric: "rating", label: "Google-Sterne", value: rating.value, previous: before?.value ?? null, baseline: base("google", "rating"), format: "rating" });
  }
  const reviews = await latestMetric(customerId, "google", "review_count");
  if (reviews) {
    const before = await latestMetric(customerId, "google", "review_count", addDays(today, -30));
    items.push({ platform: "google", metric: "review_count", label: "Google-Bewertungen", value: reviews.value, previous: before?.value ?? null, baseline: base("google", "review_count"), format: "number" });
  }
  const [cur, old] = await Promise.all([postsInRange(customerId, range), postsInRange(customerId, prev)]);
  if (cur.length || old.length) {
    items.push({
      platform: "all",
      metric: "views",
      label: "Video-Aufrufe (30 Tage)",
      value: postTotals(cur).views,
      previous: postTotals(old).views,
      baseline: null,
      format: "number",
    });
  }
  const gClicks = await sumMetric(customerId, "google", "website_clicks", range);
  const gClicksPrev = await sumMetric(customerId, "google", "website_clicks", prev);
  if (gClicks || gClicksPrev) {
    items.push({ platform: "google", metric: "website_clicks", label: "Klicks über Google (30 T.)", value: gClicks, previous: gClicksPrev, baseline: base("google", "website_clicks"), format: "number" });
  }
  const clicks = await linkClicksInRange(customerId, range);
  const clicksPrev = await linkClicksInRange(customerId, prev);
  if (clicks || clicksPrev) {
    items.push({ platform: "link", metric: "clicks", label: "Tracking-Link-Klicks (30 T.)", value: clicks, previous: clicksPrev, baseline: null, format: "number" });
  }
  const ads = await adTotals(customerId, range);
  if (ads.spend) {
    const adsPrev = await adTotals(customerId, prev);
    items.push({ platform: "ads", metric: "clicks", label: "Klicks aus Anzeigen (30 T.)", value: ads.clicks, previous: adsPrev.clicks, baseline: null, format: "number" });
  }
  return items;
}

/**
 * Vorher/Nachher: Ausgangswerte (vor Start der Zusammenarbeit) im Vergleich
 * zu heute bzw. zum Durchschnitt der letzten 3 Monate.
 */
export async function getBeforeAfter(customerId: number) {
  const baseRows = await db.select().from(baselines).where(eq(baselines.customerId, customerId));
  const today = todayISO();
  const lastMonths = monthsBetween(addMonthKey(monthKey(today), -3), addMonthKey(monthKey(today), -1));
  const out: { platform: string; metric: string; label: string; before: number; after: number | null; kind: "bestand" | "zeitraum" }[] = [];
  for (const b of baseRows) {
    const kind = metricKind(b.platform, b.metric);
    const label = ACCOUNT_METRICS.find((m) => m.platform === b.platform && m.metric === b.metric)?.label ?? b.metric;
    let after: number | null = null;
    if (kind === "bestand") {
      after = (await latestMetric(customerId, b.platform, b.metric))?.value ?? null;
    } else {
      const months = await metricByMonth(customerId, b.platform, b.metric, lastMonths);
      const vals = months.map((m) => m.value).filter((v): v is number => v != null);
      after = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    }
    out.push({ platform: b.platform, metric: b.metric, label, before: b.value, after, kind });
  }
  return out;
}
