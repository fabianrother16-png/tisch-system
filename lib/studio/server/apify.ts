// Apify-Anbindung: startet die TikTok-/Instagram-Scraper asynchron, fragt den
// Status ab und normalisiert die Ergebnisse auf SocialPost/CreatorProfile.
// Asynchron (Start + Polling statt run-sync), damit lange Läufe nicht an
// Serverless-Timeouts scheitern.

import type { ScrapeJobSchema, ScrapeKind, ScrapePoll } from "../scrape";
import type { CreatorProfile, SocialPost } from "../types";
import type { z } from "zod";
import { env, requireKey, StudioError } from "./env";

const API = process.env.APIFY_API_BASE || "https://api.apify.com/v2";

const ACTORS = {
  tiktok: () => process.env.APIFY_TIKTOK_ACTOR || "clockworks~tiktok-scraper",
  igHashtag: () => process.env.APIFY_IG_HASHTAG_ACTOR || "apify~instagram-hashtag-scraper",
  igReels: () => process.env.APIFY_IG_REELS_ACTOR || "apify~instagram-reel-scraper",
  igProfile: () => process.env.APIFY_IG_PROFILE_ACTOR || "apify~instagram-scraper",
};

function token() {
  return requireKey(env.apifyToken(), "APIFY_API_TOKEN", "ohne Apify können keine TikTok-/Instagram-Daten geladen werden");
}

async function apify<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 401) throw new StudioError("APIFY_API_TOKEN ist ungültig.", 503);
    if (response.status === 402) {
      throw new StudioError("Apify-Guthaben bzw. Plan-Limit erreicht. Bitte im Apify-Konto prüfen.", 402);
    }
    throw new StudioError(`Apify-Fehler ${response.status}: ${text.slice(0, 300)}`, 502);
  }
  return (await response.json()) as T;
}

type Job = z.output<typeof ScrapeJobSchema>;

function actorInput(job: Job): { actor: string; input: Record<string, unknown>; maxItems: number } {
  switch (job.kind) {
    case "tiktok-search":
      return {
        actor: ACTORS.tiktok(),
        maxItems: job.queries.length * job.perQuery,
        input: {
          searchQueries: job.queries,
          searchSection: "/video",
          resultsPerPage: job.perQuery,
          proxyCountryCode: job.region,
          ...(job.recent ? { videoSearchDateFilter: "PAST_MONTH", videoSearchSorting: "MOST_LIKED" } : {}),
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSlideshowImages: false,
          shouldDownloadAvatars: false,
          shouldDownloadMusicCovers: false,
          downloadSubtitlesOptions: "NEVER_DOWNLOAD_SUBTITLES",
        },
      };
    case "tiktok-profiles":
      return {
        actor: ACTORS.tiktok(),
        maxItems: job.handles.length * job.perProfile,
        input: {
          profiles: job.handles,
          resultsPerPage: job.perProfile,
          profileSorting: "latest",
          profileScrapeSections: ["videos"],
          excludePinnedPosts: false,
          proxyCountryCode: job.region,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSlideshowImages: false,
          shouldDownloadAvatars: false,
          shouldDownloadMusicCovers: false,
          // Vorhandene TikTok-Untertitel sind kostenlos; die Transkription
          // per Spracherkennung (für Videos ohne Untertitel) kostet extra.
          downloadSubtitlesOptions: job.transcripts
            ? "DOWNLOAD_AND_TRANSCRIBE_VIDEOS_WITHOUT_SUBTITLES"
            : "DOWNLOAD_SUBTITLES",
        },
      };
    case "instagram-hashtags":
      return {
        actor: ACTORS.igHashtag(),
        maxItems: job.hashtags.length * job.perTag,
        input: { hashtags: job.hashtags, resultsType: "reels", resultsLimit: job.perTag },
      };
    case "instagram-reels":
      return {
        actor: ACTORS.igReels(),
        maxItems: job.handles.length * job.perProfile,
        input: {
          username: job.handles,
          resultsLimit: job.perProfile,
          includeTranscript: job.transcripts,
          skipPinnedPosts: false,
        },
      };
    case "instagram-profiles":
      return {
        actor: ACTORS.igProfile(),
        maxItems: job.handles.length,
        input: {
          directUrls: job.handles.map((h) => `https://www.instagram.com/${h}/`),
          resultsType: "details",
          resultsLimit: 1,
        },
      };
  }
}

export async function startScrape(job: Job) {
  const { actor, input, maxItems } = actorInput(job);
  const params = new URLSearchParams({
    maxItems: String(maxItems),
    maxTotalChargeUsd: String(env.apifyMaxChargeUsd()),
  });
  const result = await apify<{ data: { id: string } }>(`/acts/${actor}/runs?${params}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.data.id;
}

type RunInfo = { status: string; statusMessage?: string; defaultDatasetId: string };

export async function pollScrape(runId: string, kind: ScrapeKind): Promise<ScrapePoll> {
  if (!/^[A-Za-z0-9]{8,40}$/.test(runId)) throw new StudioError("Ungültige Lauf-ID.", 400);
  const run = (await apify<{ data: RunInfo }>(`/actor-runs/${runId}`)).data;

  if (["READY", "RUNNING", "TIMING-OUT", "ABORTING"].includes(run.status)) {
    return { status: "running", message: run.statusMessage };
  }
  if (run.status === "FAILED") {
    return { status: "failed", message: run.statusMessage || "Der Scraper-Lauf ist fehlgeschlagen." };
  }
  // SUCCEEDED, TIMED-OUT oder ABORTED: vorhandene Ergebnisse trotzdem nutzen.
  const items = await apify<RawItem[]>(`/datasets/${run.defaultDatasetId}/items?clean=true&limit=2000`);

  if (kind === "instagram-profiles") {
    return { status: "done", profiles: items.map(normalizeIgProfile).filter((p): p is CreatorProfile => p !== null) };
  }

  const source: SocialPost["source"] =
    kind === "tiktok-search" ? "search" : kind === "instagram-hashtags" ? "hashtag" : "profile";
  const isTikTok = kind.startsWith("tiktok");
  const posts: SocialPost[] = [];
  const profiles = new Map<string, CreatorProfile>();
  for (const item of items) {
    if (isTikTok) {
      const normalized = normalizeTikTok(item, source);
      if (!normalized) continue;
      posts.push(normalized.post);
      if (normalized.profile) profiles.set(normalized.profile.key, normalized.profile);
    } else {
      const post = normalizeInstagram(item, source);
      if (post) posts.push(post);
    }
  }

  if (kind === "tiktok-profiles") await attachTikTokTranscripts(items, posts);

  return {
    status: "done",
    message: run.status !== "SUCCEEDED" ? "Lauf vorzeitig beendet – Teilergebnisse." : undefined,
    posts: dedupe(posts),
    profiles: [...profiles.values()],
  };
}

// ---------------------------------------------------------------------------
// Normalisierung
// ---------------------------------------------------------------------------

type RawItem = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0);
const optNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const obj = (v: unknown) => (v && typeof v === "object" ? (v as RawItem) : {});

function dedupe(posts: SocialPost[]) {
  const seen = new Map<string, SocialPost>();
  for (const p of posts) if (!seen.has(p.id)) seen.set(p.id, p);
  return [...seen.values()];
}

function normalizeTikTok(item: RawItem, source: SocialPost["source"]) {
  if (item.error || !item.id || item.isAd === true) return null;
  const author = obj(item.authorMeta);
  const handle = str(author.name).toLowerCase();
  if (!handle) return null;
  const music = obj(item.musicMeta);
  const video = obj(item.videoMeta);
  const created =
    str(item.createTimeISO) || (typeof item.createTime === "number" ? new Date(item.createTime * 1000).toISOString() : "");
  const post: SocialPost = {
    id: `tt_${str(item.id) || String(item.id)}`,
    platform: "tiktok",
    url: str(item.webVideoUrl) || `https://www.tiktok.com/@${handle}/video/${String(item.id)}`,
    author: handle,
    authorName: str(author.nickName) || undefined,
    followers: optNum(author.fans),
    caption: str(item.text),
    hashtags: Array.isArray(item.hashtags)
      ? (item.hashtags as RawItem[]).map((h) => str(h.name).toLowerCase()).filter(Boolean)
      : [],
    views: num(item.playCount),
    likes: num(item.diggCount),
    comments: num(item.commentCount),
    shares: num(item.shareCount),
    saves: num(item.collectCount),
    durationSec: optNum(video.duration),
    postedAt: created || undefined,
    sound: str(music.musicName)
      ? { name: str(music.musicName), author: str(music.musicAuthor) || undefined, original: music.musicOriginal === true }
      : undefined,
    isVideo: item.isSlideshow !== true,
    isPinned: item.isPinned === true,
    thumbnail: str(video.coverUrl) || undefined,
    source,
    query: str(item.searchQuery) || undefined,
  };
  const profile: CreatorProfile = {
    key: `tiktok:${handle}`,
    platform: "tiktok",
    handle,
    name: str(author.nickName) || undefined,
    followers: optNum(author.fans),
    following: optNum(author.following),
    postsCount: optNum(author.video),
    likesTotal: optNum(author.heart),
    bio: str(author.signature) || undefined,
    verified: author.verified === true,
    avatar: str(author.avatar) || undefined,
    url: str(author.profileUrl) || `https://www.tiktok.com/@${handle}`,
  };
  return { post, profile };
}

function normalizeInstagram(item: RawItem, source: SocialPost["source"]): SocialPost | null {
  if (item.error || !(item.shortCode || item.id)) return null;
  const handle = str(item.ownerUsername).toLowerCase();
  if (!handle) return null;
  const music = obj(item.musicInfo);
  const shortCode = str(item.shortCode);
  const views = num(item.videoPlayCount) || num(item.igPlayCount) || num(item.videoViewCount);
  return {
    id: `ig_${shortCode || String(item.id)}`,
    platform: "instagram",
    url: str(item.url) || `https://www.instagram.com/reel/${shortCode}/`,
    author: handle,
    authorName: str(item.ownerFullName) || undefined,
    caption: str(item.caption),
    hashtags: Array.isArray(item.hashtags) ? (item.hashtags as unknown[]).map((h) => str(h).toLowerCase()).filter(Boolean) : [],
    views,
    likes: num(item.likesCount),
    comments: num(item.commentsCount),
    shares: num(item.sharesCount),
    saves: 0,
    durationSec: optNum(item.videoDuration),
    postedAt: str(item.timestamp) || undefined,
    sound: str(music.song_name)
      ? {
          name: str(music.song_name),
          author: str(music.artist_name) || undefined,
          original: music.uses_original_audio === true,
        }
      : undefined,
    transcript: str(item.transcript) || undefined,
    isVideo: str(item.type) === "Video" || str(item.productType) === "clips",
    isPinned: item.isPinned === true,
    thumbnail: str(item.displayUrl) || undefined,
    source,
  };
}

function normalizeIgProfile(item: RawItem): CreatorProfile | null {
  const handle = str(item.username).toLowerCase();
  if (item.error || !handle) return null;
  return {
    key: `instagram:${handle}`,
    platform: "instagram",
    handle,
    name: str(item.fullName) || undefined,
    followers: optNum(item.followersCount),
    following: optNum(item.followsCount),
    postsCount: optNum(item.postsCount),
    bio: str(item.biography) || undefined,
    verified: item.verified === true,
    avatar: str(item.profilePicUrl) || undefined,
    url: `https://www.instagram.com/${handle}/`,
  };
}

// ---------------------------------------------------------------------------
// TikTok-Untertitel/Transkripte nachladen
// ---------------------------------------------------------------------------

function pickSubtitle(item: RawItem): string | null {
  const video = obj(item.videoMeta);
  const transcription = str(video.transcriptionLink);
  if (transcription) return transcription;
  const links = Array.isArray(video.subtitleLinks) ? (video.subtitleLinks as RawItem[]) : [];
  if (!links.length) return null;
  const byLang = (prefixes: string[]) =>
    links.find((l) => prefixes.some((p) => str(l.language).toLowerCase().startsWith(p)));
  const chosen = byLang(["deu", "de", "ger"]) ?? byLang(["eng", "en"]) ?? links[0];
  return str(chosen.downloadLink) || str(chosen.tiktokLink) || null;
}

export function vttToText(vtt: string) {
  return vtt
    .replace(/^WEBVTT.*$/m, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/-->/.test(line) && !/^\d+$/.test(line.trim()) && !/^(NOTE|STYLE)/.test(line))
    .map((line) => line.replace(/<[^>]+>/g, "").trim())
    .filter((line, i, arr) => line !== arr[i - 1])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function attachTikTokTranscripts(items: RawItem[], posts: SocialPost[]) {
  const byId = new Map(posts.map((p) => [p.id, p]));
  const jobs = items
    .map((item) => ({ post: byId.get(`tt_${String(item.id)}`), link: pickSubtitle(item) }))
    .filter((j): j is { post: SocialPost; link: string } => Boolean(j.post && j.link))
    .slice(0, 80);

  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const { post, link } = jobs[cursor++];
      try {
        const url = new URL(link);
        const headers: Record<string, string> = {};
        if (url.hostname === "api.apify.com") headers.Authorization = `Bearer ${token()}`;
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
        if (!response.ok) continue;
        const text = await response.text();
        const plain = text.includes("-->") ? vttToText(text) : text.replace(/\s+/g, " ").trim();
        if (plain) post.transcript = plain.slice(0, 3000);
      } catch {
        // Untertitel sind ein Bonus – fehlende Links ignorieren.
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
}
