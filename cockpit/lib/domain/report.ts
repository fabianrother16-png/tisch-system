import { and, count, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../db";
import { contents, events } from "../db/schema";
import { addMonthKey, currentMonth, monthsBetween } from "../dates";
import { VISIT_EVENT_TYPES } from "../constants";
import {
  adTotals,
  getBeforeAfter,
  getCustomerSnapshot,
  linkClicksByDay,
  linkClicksInRange,
  metricByMonth,
  metricSeries,
  postsInRange,
  postTotals,
  previousRange,
  resolveRange,
  viewsByMonth,
} from "./performance";

export type PerformanceData = Awaited<ReturnType<typeof buildPerformanceData>>;

/** Alle Zahlen für die Performance-Ansicht eines Kunden (intern & Kunden-Report). */
export async function buildPerformanceData(customerId: number, rangeKey?: string) {
  const range = resolveRange(rangeKey);
  const prev = previousRange(range);
  const months = monthsBetween(addMonthKey(currentMonth(), -11), currentMonth());

  const [cur, old, monthly, snapshot, beforeAfter, linkTotal, linkPrev, linkDaily, ads, adsPrev] = await Promise.all([
    postsInRange(customerId, range),
    postsInRange(customerId, prev),
    viewsByMonth(customerId, months),
    getCustomerSnapshot(customerId),
    getBeforeAfter(customerId),
    linkClicksInRange(customerId, range),
    linkClicksInRange(customerId, prev),
    linkClicksByDay(customerId, range),
    adTotals(customerId, range),
    adTotals(customerId, prev),
  ]);

  // Follower-Verlauf je Plattform, nach Datum zusammengeführt
  const followerPlatforms = ["instagram", "tiktok", "facebook", "youtube"];
  const followerSeries = await Promise.all(followerPlatforms.map((p) => metricSeries(customerId, p, "followers", range)));
  const followerByDate = new Map<string, Record<string, number | string>>();
  followerSeries.forEach((series, i) => {
    for (const r of series) {
      const row = followerByDate.get(r.date) ?? { date: r.date };
      row[followerPlatforms[i]] = r.value;
      followerByDate.set(r.date, row);
    }
  });
  const followers = [...followerByDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const followerKeys = followerPlatforms.filter((_, i) => followerSeries[i].length > 0);

  // Google-Unternehmensprofil je Monat
  const [gWeb, gCall, gDir, gImp] = await Promise.all(
    ["website_clicks", "call_clicks", "direction_requests", "impressions"].map((m) => metricByMonth(customerId, "google", m, months)),
  );
  const google = months.map((m, i) => ({
    month: m,
    website_clicks: gWeb[i].value ?? 0,
    call_clicks: gCall[i].value ?? 0,
    direction_requests: gDir[i].value ?? 0,
    impressions: gImp[i].value ?? 0,
  }));
  const hasGoogle = google.some((g) => g.website_clicks || g.call_clicks || g.direction_requests);

  const [ratingSeries, reviewSeries] = await Promise.all([
    metricByMonth(customerId, "google", "rating", months),
    metricByMonth(customerId, "google", "review_count", months),
  ]);
  const reviews = months.map((m, i) => ({ month: m, rating: ratingSeries[i].value, review_count: reviewSeries[i].value }));
  const hasReviews = reviews.some((r) => r.rating != null || r.review_count != null);

  // Geleistete Arbeit im Zeitraum
  const [[published], [visits]] = await Promise.all([
    db
      .select({ n: count() })
      .from(contents)
      .where(and(eq(contents.customerId, customerId), eq(contents.status, "veroeffentlicht"), gte(contents.publishDate, range.from), lte(contents.publishDate, range.to))),
    db
      .select({ n: count() })
      .from(events)
      .where(and(eq(events.customerId, customerId), inArray(events.type, VISIT_EVENT_TYPES), gte(events.start, range.from), lte(events.start, `${range.to}T23:59`))),
  ]);

  const totals = postTotals(cur);
  const totalsPrev = postTotals(old);
  const top = [...cur].sort((a, b) => b.views - a.views).slice(0, 10);
  const avgViews = totals.avgViews;

  return {
    range,
    prev,
    totals,
    totalsPrev,
    monthly,
    followers,
    followerKeys,
    google,
    hasGoogle,
    reviews,
    hasReviews,
    snapshot,
    beforeAfter,
    linkTotal,
    linkPrev,
    linkDaily,
    ads,
    adsPrev,
    top,
    viralThreshold: avgViews > 0 ? Math.max(avgViews * 3, 1000) : undefined,
    work: { published: published.n, visits: visits.n, posts: cur.length },
    months,
  };
}
