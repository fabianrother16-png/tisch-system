import "server-only";
import { truncate } from "./net";

/**
 * Live-Daten über Apify-Actors (offizielle Scraper aus dem Apify Store).
 * Ein APIFY_TOKEN deckt TikTok, Instagram und Google Maps ab; abgerechnet wird pro Ergebnis bei Apify.
 */
async function runActor<T>(actor: string, input: Record<string, unknown>, timeoutSecs = 120): Promise<T[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("Kein APIFY_TOKEN hinterlegt – Live-Daten aus TikTok/Instagram/Google Maps sind nicht verbunden.");
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=${timeoutSecs}&format=json&clean=true`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout((timeoutSecs + 30) * 1000),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify (${actor}) antwortet mit ${res.status}: ${truncate(text, 300)}`);
  }
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as T[]) : [];
}

const clamp = (n: number | undefined, def: number, max: number) => Math.max(1, Math.min(max, Math.round(n ?? def)));
const cleanTag = (t: string) => t.replace(/^#/, "").trim();

// ── TikTok ──────────────────────────────────────────────────────────────────

interface TikTokItem {
  text?: string;
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  collectCount?: number;
  createTimeISO?: string;
  webVideoUrl?: string;
  authorMeta?: { name?: string; fans?: number };
  videoMeta?: { duration?: number };
  musicMeta?: { musicName?: string; musicAuthor?: string };
  hashtags?: { name?: string }[];
  isAd?: boolean;
}

export async function tiktokResearch(input: {
  hashtags?: string[];
  searchQueries?: string[];
  profiles?: string[];
  limit?: number;
}) {
  const limit = clamp(input.limit, 15, 40);
  const items = await runActor<TikTokItem>("clockworks~tiktok-scraper", {
    hashtags: (input.hashtags ?? []).map(cleanTag),
    searchQueries: input.searchQueries ?? [],
    profiles: (input.profiles ?? []).map((p) => p.replace(/^@/, "")),
    resultsPerPage: limit,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadAvatars: false,
    shouldDownloadSubtitles: false,
  });
  return items
    .map((v) => ({
      text: truncate(v.text ?? "", 300),
      aufrufe: v.playCount ?? 0,
      likes: v.diggCount ?? 0,
      kommentare: v.commentCount ?? 0,
      geteilt: v.shareCount ?? 0,
      gespeichert: v.collectCount ?? 0,
      dauerSek: v.videoMeta?.duration ?? null,
      datum: v.createTimeISO ?? null,
      account: v.authorMeta?.name ?? null,
      follower: v.authorMeta?.fans ?? null,
      musik: v.musicMeta?.musicName ?? null,
      hashtags: (v.hashtags ?? []).map((h) => h.name).filter(Boolean),
      anzeige: v.isAd ?? false,
      link: v.webVideoUrl ?? null,
    }))
    .sort((a, b) => b.aufrufe - a.aufrufe)
    .slice(0, limit * 2);
}

// ── Instagram ───────────────────────────────────────────────────────────────

interface InstagramItem {
  type?: string;
  productType?: string;
  caption?: string;
  hashtags?: string[];
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  videoDuration?: number;
  timestamp?: string;
  url?: string;
  ownerUsername?: string;
  // Profil-Details
  username?: string;
  followersCount?: number;
  postsCount?: number;
  biography?: string;
}

export async function instagramResearch(input: {
  usernames?: string[];
  hashtags?: string[];
  resultsType?: "posts" | "reels" | "details";
  limit?: number;
}) {
  const limit = clamp(input.limit, 12, 40);
  const directUrls = [
    ...(input.usernames ?? []).map((u) => `https://www.instagram.com/${u.replace(/^@/, "").trim()}/`),
    ...(input.hashtags ?? []).map((h) => `https://www.instagram.com/explore/tags/${encodeURIComponent(cleanTag(h))}/`),
  ];
  if (directUrls.length === 0) throw new Error("Bitte mindestens einen Account oder Hashtag angeben.");
  const items = await runActor<InstagramItem>("apify~instagram-scraper", {
    directUrls,
    resultsType: input.resultsType ?? "posts",
    resultsLimit: limit,
    addParentData: false,
  });
  if (input.resultsType === "details") {
    return items.map((p) => ({
      account: p.username,
      follower: p.followersCount,
      beitraege: p.postsCount,
      bio: truncate(p.biography ?? "", 300),
    }));
  }
  return items
    .map((p) => ({
      typ: p.productType === "clips" ? "Reel" : p.type ?? null,
      text: truncate(p.caption ?? "", 300),
      likes: p.likesCount ?? 0,
      kommentare: p.commentsCount ?? 0,
      aufrufe: p.videoPlayCount ?? p.videoViewCount ?? null,
      dauerSek: p.videoDuration ?? null,
      datum: p.timestamp ?? null,
      account: p.ownerUsername ?? null,
      hashtags: p.hashtags ?? [],
      link: p.url ?? null,
    }))
    .sort((a, b) => (b.aufrufe ?? b.likes) - (a.aufrufe ?? a.likes));
}

// ── Google Maps ─────────────────────────────────────────────────────────────

interface PlaceItem {
  title?: string;
  categoryName?: string;
  categories?: string[];
  totalScore?: number;
  reviewsCount?: number;
  address?: string;
  city?: string;
  website?: string;
  phone?: string;
  url?: string;
  imagesCount?: number;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
}

export async function googleMapsResearch(input: {
  query: string;
  location: string;
  limit?: number;
  onlyWithoutWebsite?: boolean;
}) {
  const limit = clamp(input.limit, 15, 40);
  const items = await runActor<PlaceItem>("compass~crawler-google-places", {
    searchStringsArray: [input.query],
    locationQuery: input.location,
    maxCrawledPlacesPerSearch: limit,
    language: "de",
    skipClosedPlaces: true,
    website: input.onlyWithoutWebsite ? "withoutWebsite" : "allPlaces",
  });
  return items.map((p) => ({
    name: p.title ?? null,
    kategorie: p.categoryName ?? null,
    weitereKategorien: (p.categories ?? []).slice(0, 5),
    bewertung: p.totalScore ?? null,
    anzahlBewertungen: p.reviewsCount ?? 0,
    fotos: p.imagesCount ?? null,
    adresse: p.address ?? null,
    website: p.website ?? null,
    telefon: p.phone ?? null,
    mapsLink: p.url ?? null,
  }));
}
