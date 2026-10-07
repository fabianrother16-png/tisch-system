// Datengetriebene Auswertung der gescrapten Posts (läuft im Browser):
// Konkurrenten-Ranking, Profil-Kennzahlen und Trend-Statistiken. Alles hier
// sind echte Rechenwerte aus den Plattform-Daten – keine KI-Schätzungen.

import { clamp, median } from "./format";
import type { PostInput } from "./tasks";
import type { CreatorCandidate, CreatorProfile, DataTrends, ProfileStats, SocialPost } from "./types";

export function engagement(p: SocialPost) {
  return p.views > 0 ? (p.likes + p.comments + p.shares + p.saves) / p.views : 0;
}

export function creatorKey(p: Pick<SocialPost, "platform" | "author">) {
  return `${p.platform}:${p.author}`;
}

export function profileUrl(platform: SocialPost["platform"], handle: string) {
  return platform === "tiktok" ? `https://www.tiktok.com/@${handle}` : `https://www.instagram.com/${handle}/`;
}

/**
 * Gruppiert Suchtreffer nach Account und berechnet einen nachvollziehbaren
 * Score aus Reichweite (Median), Spitze (Max), Engagement und Konstanz
 * (mehrere Treffer = kein Zufallstreffer).
 */
export function aggregateCreators(posts: SocialPost[], profiles: Record<string, CreatorProfile> = {}): CreatorCandidate[] {
  const groups = new Map<string, SocialPost[]>();
  for (const p of posts) {
    if (!p.author) continue;
    const key = creatorKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const candidates: CreatorCandidate[] = [];
  for (const [key, list] of groups) {
    const first = list[0];
    const views = list.map((p) => p.views);
    const med = median(views);
    const max = Math.max(...views);
    const er = median(list.filter((p) => p.views > 0).map(engagement));
    const reach = clamp(Math.log10(med + 1) / 7, 0, 1);
    const peak = clamp(Math.log10(max + 1) / 7, 0, 1);
    const erScore = clamp(er / 0.1, 0, 1);
    const consistency = Math.min(list.length, 4) / 4;
    const profile = profiles[key];
    candidates.push({
      key,
      platform: first.platform,
      handle: first.author,
      name: profile?.name ?? first.authorName,
      followers: profile?.followers ?? first.followers,
      bio: profile?.bio,
      url: profile?.url ?? profileUrl(first.platform, first.author),
      postCount: list.length,
      medianViews: med,
      maxViews: max,
      totalViews: views.reduce((a, b) => a + b, 0),
      engagementRate: er,
      score: 100 * (0.4 * reach + 0.25 * peak + 0.2 * erScore + 0.15 * consistency),
      topPosts: [...list].sort((a, b) => b.views - a.views).slice(0, 5),
    });
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export function profileStats(posts: SocialPost[]): ProfileStats {
  const views = posts.map((p) => p.views);
  const med = median(views);
  const dates = posts
    .map((p) => (p.postedAt ? new Date(p.postedAt).getTime() : NaN))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  let postsPerWeek: number | null = null;
  if (dates.length >= 3) {
    const spanWeeks = (dates[dates.length - 1] - dates[0]) / (7 * 24 * 3600 * 1000);
    if (spanWeeks > 0.2) postsPerWeek = (dates.length - 1) / spanWeeks;
  }
  const durations = posts.map((p) => p.durationSec).filter((d): d is number => typeof d === "number" && d > 0);
  return {
    count: posts.length,
    medianViews: med,
    avgViews: views.length ? views.reduce((a, b) => a + b, 0) / views.length : 0,
    maxViews: views.length ? Math.max(...views) : 0,
    engagementRate: median(posts.filter((p) => p.views > 0).map(engagement)),
    postsPerWeek,
    avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    outliers: med > 0 ? posts.filter((p) => p.views > 3 * med).length : 0,
  };
}

const GENERIC_TAGS = new Set([
  "fyp",
  "foryou",
  "foryoupage",
  "fy",
  "fypシ",
  "fypage",
  "viral",
  "viralvideo",
  "trending",
  "trend",
  "explore",
  "explorepage",
  "reels",
  "reelsinstagram",
  "instagram",
  "tiktok",
  "foryourpage",
  "xyzbca",
  "capcut",
  "fürdich",
  "fürdichseite",
  "fy_",
]);

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function berlinParts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  return idx >= 0 && Number.isFinite(hour) ? { day: idx, hour } : null;
}

export function computeDataTrends(posts: SocialPost[], recentPosts: SocialPost[] = []): DataTrends {
  const all = dedupe([...posts, ...recentPosts]);

  const tagMap = new Map<string, { posts: number; views: number }>();
  for (const p of all) {
    for (const tag of new Set(p.hashtags)) {
      const t = tagMap.get(tag) ?? { posts: 0, views: 0 };
      t.posts++;
      t.views += p.views;
      tagMap.set(tag, t);
    }
  }
  const hashtags = [...tagMap.entries()]
    .filter(([, v]) => v.posts >= 2)
    .map(([tag, v]) => ({ tag, ...v, generic: GENERIC_TAGS.has(tag) }))
    .sort((a, b) => b.views * Math.sqrt(b.posts) - a.views * Math.sqrt(a.posts))
    .slice(0, 30);

  const soundMap = new Map<string, DataTrends["sounds"][number]>();
  for (const p of all) {
    if (!p.sound || p.sound.original) continue;
    const name = p.sound.name.trim();
    if (!name || /original|originalton|sonido original|som original/i.test(name)) continue;
    const key = `${p.platform}:${name.toLowerCase()}`;
    const s = soundMap.get(key) ?? { name, author: p.sound.author, posts: 0, views: 0, platform: p.platform };
    s.posts++;
    s.views += p.views;
    soundMap.set(key, s);
  }
  const sounds = [...soundMap.values()]
    .filter((s) => s.posts >= 2)
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const buckets: [string, number, number][] = [
    ["unter 15 s", 0, 15],
    ["15–30 s", 15, 30],
    ["30–60 s", 30, 60],
    ["60–90 s", 60, 90],
    ["über 90 s", 90, Infinity],
  ];
  const lengths = buckets.map(([bucket, lo, hi]) => {
    const inBucket = all.filter((p) => p.durationSec != null && p.durationSec >= lo && p.durationSec < hi);
    return { bucket, posts: inBucket.length, medianViews: median(inBucket.map((p) => p.views)) };
  });

  const byDay = new Map<number, number[]>();
  const byHour = new Map<number, number[]>();
  for (const p of all) {
    if (!p.postedAt) continue;
    const parts = berlinParts(p.postedAt);
    if (!parts) continue;
    byDay.set(parts.day, [...(byDay.get(parts.day) ?? []), p.views]);
    byHour.set(parts.hour, [...(byHour.get(parts.hour) ?? []), p.views]);
  }
  const weekdays = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    day: WEEKDAYS[d],
    posts: byDay.get(d)?.length ?? 0,
    medianViews: median(byDay.get(d) ?? []),
  }));
  const hours = [...byHour.entries()]
    .map(([hour, v]) => ({ hour, posts: v.length, medianViews: median(v) }))
    .sort((a, b) => a.hour - b.hour);

  const monthAgo = Date.now() - 35 * 24 * 3600 * 1000;
  const recentViral = all
    .filter((p) => p.postedAt && new Date(p.postedAt).getTime() >= monthAgo)
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  return { hashtags, sounds, lengths, weekdays, hours, recentViral, analysedPosts: all.length };
}

function dedupe(posts: SocialPost[]) {
  const seen = new Map<string, SocialPost>();
  for (const p of posts) if (!seen.has(p.id)) seen.set(p.id, p);
  return [...seen.values()];
}

/** Reduziert einen Post auf das, was die KI braucht (spart Tokens). */
export function toPostInput(p: SocialPost, transcriptChars = 1800): PostInput {
  return {
    id: p.id,
    platform: p.platform,
    author: p.author,
    caption: p.caption.slice(0, 1200),
    hashtags: p.hashtags.slice(0, 30),
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    saves: p.saves,
    durationSec: p.durationSec,
    postedAt: p.postedAt,
    sound: p.sound,
    transcript: p.transcript?.slice(0, transcriptChars),
    isVideo: p.isVideo,
    isPinned: p.isPinned,
  };
}
