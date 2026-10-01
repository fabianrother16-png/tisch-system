import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { adCampaigns, adStatsDaily, metricsDaily, postSnapshots, posts } from "../db/schema";
import { todayISO } from "../dates";

export async function upsertMetric(customerId: number, platform: string, metric: string, date: string, value: number, source: "api" | "manuell" = "api") {
  if (!Number.isFinite(value)) return;
  await db
    .insert(metricsDaily)
    .values({ customerId, platform, metric, date, value, source })
    .onConflictDoUpdate({
      target: [metricsDaily.customerId, metricsDaily.platform, metricsDaily.metric, metricsDaily.date],
      set: { value, source },
    });
}

export type PostInput = {
  platform: string;
  externalId: string;
  url?: string | null;
  caption?: string | null;
  mediaType?: string | null;
  thumbnailUrl?: string | null;
  publishedAt: string;
  views?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
};

/** Beitrag anlegen/aktualisieren und Tagesstand für den Verlauf sichern */
export async function upsertPost(customerId: number, p: PostInput) {
  const metrics = {
    views: Math.round(p.views ?? 0),
    reach: Math.round(p.reach ?? 0),
    likes: Math.round(p.likes ?? 0),
    comments: Math.round(p.comments ?? 0),
    shares: Math.round(p.shares ?? 0),
    saves: Math.round(p.saves ?? 0),
  };
  const now = new Date().toISOString();
  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.platform, p.platform), eq(posts.externalId, p.externalId)))
    .limit(1);
  let id: number;
  if (existing) {
    id = existing.id;
    await db
      .update(posts)
      .set({ ...metrics, url: p.url ?? undefined, caption: p.caption ?? undefined, thumbnailUrl: p.thumbnailUrl ?? undefined, lastSyncedAt: now })
      .where(eq(posts.id, id));
  } else {
    // Manuell angelegter Beitrag mit gleicher URL wird übernommen statt doppelt angelegt
    const [byUrl] = p.url
      ? await db.select({ id: posts.id }).from(posts).where(and(eq(posts.customerId, customerId), eq(posts.url, p.url))).limit(1)
      : [];
    if (byUrl) {
      id = byUrl.id;
      await db.update(posts).set({ ...metrics, externalId: p.externalId, source: "api", lastSyncedAt: now }).where(eq(posts.id, id));
    } else {
      const [row] = await db
        .insert(posts)
        .values({
          customerId,
          platform: p.platform,
          externalId: p.externalId,
          url: p.url ?? null,
          caption: p.caption ?? null,
          mediaType: p.mediaType ?? null,
          thumbnailUrl: p.thumbnailUrl ?? null,
          publishedAt: p.publishedAt,
          ...metrics,
          source: "api",
          lastSyncedAt: now,
        })
        .returning({ id: posts.id });
      id = row.id;
    }
  }
  await db
    .insert(postSnapshots)
    .values({ postId: id, date: todayISO(), ...metrics })
    .onConflictDoUpdate({ target: [postSnapshots.postId, postSnapshots.date], set: metrics });
  return id;
}

export async function upsertCampaign(customerId: number, platform: string, externalId: string, name: string, status?: string) {
  const [existing] = await db
    .select({ id: adCampaigns.id })
    .from(adCampaigns)
    .where(and(eq(adCampaigns.platform, platform), eq(adCampaigns.externalId, externalId)))
    .limit(1);
  if (existing) {
    await db.update(adCampaigns).set({ name, status: status ?? "aktiv" }).where(eq(adCampaigns.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(adCampaigns)
    .values({ customerId, platform, externalId, name, status: status ?? "aktiv", source: "api" })
    .returning({ id: adCampaigns.id });
  return row.id;
}

export async function upsertAdStat(
  campaignId: number,
  date: string,
  s: { spend: number; impressions: number; clicks: number; reach?: number; conversions?: number; conversionValue?: number },
) {
  const values = {
    spend: Math.round(s.spend),
    impressions: Math.round(s.impressions),
    clicks: Math.round(s.clicks),
    reach: Math.round(s.reach ?? 0),
    conversions: s.conversions ?? 0,
    conversionValue: Math.round(s.conversionValue ?? 0),
  };
  await db
    .insert(adStatsDaily)
    .values({ campaignId, date, ...values })
    .onConflictDoUpdate({ target: [adStatsDaily.campaignId, adStatsDaily.date], set: values });
}
