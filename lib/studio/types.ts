// Zentrale Datentypen des SICHTWERK Studios. Alles, was im Browser
// (IndexedDB) gespeichert oder zwischen Client und API-Routen ausgetauscht
// wird, ist hier beschrieben. Die KI-Ergebnis-Typen kommen aus
// lib/studio/schemas.ts (z.infer), damit Prompt-Schema und UI nie
// auseinanderlaufen.

import type {
  ClipFinder,
  CompetitorAnalysis,
  ContentPlanResult,
  EditPlan,
  MainAnalysis,
  Script,
  SearchPlan,
  Selection,
  Synthesis,
  TrendReport,
  ViralRating,
} from "./schemas";

export type Platform = "tiktok" | "instagram";

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
};

export type Region = "DE" | "AT" | "CH";

export type Goal = "reichweite" | "kunden" | "recruiting" | "marke";

export const GOAL_LABEL: Record<Goal, string> = {
  reichweite: "Reichweite & Follower",
  kunden: "Anfragen & Kunden",
  recruiting: "Mitarbeiter & Azubis finden",
  marke: "Marke & Vertrauen aufbauen",
};

export type CaptionStyleId = "bold" | "karaoke" | "clean" | "box";

export const CAPTION_STYLE_LABEL: Record<CaptionStyleId, string> = {
  bold: "Bold Pop (TikTok-Style, Wort für Wort)",
  karaoke: "Karaoke (aktives Wort farbig)",
  clean: "Clean (dezent, 2 Zeilen)",
  box: "Box (Text auf Farbbalken)",
};

export type BrandKit = {
  primary: string;
  accent: string;
  captionStyle: CaptionStyleId;
  /** Logo als Data-URL (PNG/SVG), optional als Wasserzeichen im Video. */
  logo?: string;
  watermark: boolean;
};

export type Client = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  branche: string;
  zielgruppe: string;
  stadt: string;
  region: Region;
  plattformen: Platform[];
  ziel: Goal;
  usp: string;
  tonalitaet: string;
  cta: string;
  handles: { tiktok: string; instagram: string };
  notizen: string;
  brand: BrandKit;
};

// ---------------------------------------------------------------------------
// Social-Daten (normalisiert aus den Apify-Scrapern)
// ---------------------------------------------------------------------------

export type SocialPost = {
  /** Plattform-präfixiert, z. B. "tt_7312…" oder "ig_C9x…". */
  id: string;
  platform: Platform;
  url: string;
  author: string;
  authorName?: string;
  followers?: number;
  caption: string;
  hashtags: string[];
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  durationSec?: number;
  postedAt?: string;
  sound?: { name: string; author?: string; original: boolean };
  transcript?: string;
  isVideo: boolean;
  isPinned?: boolean;
  thumbnail?: string;
  source: "search" | "hashtag" | "profile" | "trend";
  query?: string;
};

export type CreatorProfile = {
  key: string;
  platform: Platform;
  handle: string;
  name?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  likesTotal?: number;
  bio?: string;
  verified?: boolean;
  avatar?: string;
  url: string;
};

export type CreatorCandidate = {
  key: string;
  platform: Platform;
  handle: string;
  name?: string;
  followers?: number;
  bio?: string;
  url: string;
  postCount: number;
  medianViews: number;
  maxViews: number;
  totalViews: number;
  engagementRate: number;
  score: number;
  topPosts: SocialPost[];
};

export type ProfileStats = {
  count: number;
  medianViews: number;
  avgViews: number;
  maxViews: number;
  engagementRate: number;
  postsPerWeek: number | null;
  avgDuration: number | null;
  outliers: number;
};

export type DataTrends = {
  hashtags: { tag: string; posts: number; views: number; generic: boolean }[];
  sounds: { name: string; author?: string; posts: number; views: number; platform: Platform }[];
  lengths: { bucket: string; posts: number; medianViews: number }[];
  weekdays: { day: string; posts: number; medianViews: number }[];
  hours: { hour: number; posts: number; medianViews: number }[];
  recentViral: SocialPost[];
  analysedPosts: number;
};

// ---------------------------------------------------------------------------
// Recherche-Projekt (Konkurrenz → Entwurf → Trends → fertiges Skript)
// ---------------------------------------------------------------------------

export const RESEARCH_STEPS = [
  "plan",
  "discover",
  "select",
  "main",
  "draft",
  "competitors",
  "trends",
  "final",
] as const;

export type ResearchStepId = (typeof RESEARCH_STEPS)[number];

export type StepStatus = "idle" | "running" | "done" | "error";

export type StepState = {
  status: StepStatus;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
  note?: string;
};

export type ResearchSettings = {
  plattformen: Platform[];
  transkripte: boolean;
  konkurrenten: number;
  thema: string;
};

export type ResearchProject = {
  id: string;
  clientId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  settings: ResearchSettings;
  steps: Record<ResearchStepId, StepState>;
  plan?: SearchPlan;
  discovered?: SocialPost[];
  trendPosts?: SocialPost[];
  candidates?: CreatorCandidate[];
  selection?: Selection;
  profiles?: Record<string, CreatorProfile>;
  mainPosts?: SocialPost[];
  mainAnalysis?: MainAnalysis;
  draft?: Script;
  competitorPosts?: Record<string, SocialPost[]>;
  competitorAnalyses?: Record<string, CompetitorAnalysis>;
  synthesis?: Synthesis;
  dataTrends?: DataTrends;
  trends?: TrendReport & { quellen: { title: string; url: string }[] };
  final?: Script;
};

// ---------------------------------------------------------------------------
// Video-Projekte
// ---------------------------------------------------------------------------

export type TranscriptWord = { text: string; start: number; end: number };

export type MediaSource = {
  /** Kurz-ID, die auch die KI im Schnittplan referenziert (z. B. "C1"). */
  id: string;
  assetId: string;
  kind: "video" | "audio" | "image";
  name: string;
  duration: number;
  width?: number;
  height?: number;
  origin: "upload" | "ai" | "tts";
  /** Für KI-Szenen: zu welcher Skript-Szene gehört der Clip? */
  sceneIndex?: number;
  transcript?: TranscriptWord[];
};

export type RenderedVideo = {
  assetId: string;
  createdAt: number;
  duration: number;
  mime: string;
  rating?: ViralRating;
};

export type AiGeneration = {
  sceneIndex: number;
  status: "queued" | "running" | "done" | "error";
  model: string;
  prompt: string;
  statusUrl?: string;
  responseUrl?: string;
  error?: string;
};

export type VideoSettings = {
  captions: boolean;
  progressBar: boolean;
  zielLaenge: number;
  wunsch: string;
  model: "kling-3" | "veo-3.1-fast";
  voiceId?: string;
  speed: number;
};

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  captions: true,
  progressBar: false,
  zielLaenge: 30,
  wunsch: "",
  model: "kling-3",
  speed: 1.05,
};

export type VideoProject = {
  id: string;
  clientId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  mode: "upload" | "ai";
  researchId?: string;
  script?: Script;
  sources: MediaSource[];
  voiceover?: { sourceId: string; voiceId: string; words: TranscriptWord[] };
  sceneTimings?: { index: number; start: number; end: number }[];
  settings?: VideoSettings;
  /** Ergebnis des Clip-Finders (lange Aufnahme → mehrere Shorts). */
  clipIdeas?: ClipFinder["clips"];
  clipSource?: string;
  /** Aus welchem Projekt/Clip dieses Video entstanden ist. */
  parentId?: string;
  generations?: AiGeneration[];
  editPlan?: EditPlan;
  inputRating?: ViralRating;
  renders: RenderedVideo[];
  captionStyle?: CaptionStyleId;
  status: "entwurf" | "geschnitten" | "fertig" | "gepostet";
};

export type Asset = {
  id: string;
  createdAt: number;
  name: string;
  type: string;
  size: number;
  blob: Blob;
};

// ---------------------------------------------------------------------------
// Content-Plan / Serienproduktion
// ---------------------------------------------------------------------------

export type IdeaStatus = "idee" | "skript" | "video" | "fertig" | "gepostet";

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  idee: "Idee",
  skript: "Skript",
  video: "Video",
  fertig: "Fertig",
  gepostet: "Gepostet",
};

export type ContentIdea = ContentPlanResult["ideen"][number] & {
  id: string;
  status: IdeaStatus;
  script?: Script;
  videoId?: string;
};

export type ContentPlan = {
  id: string;
  clientId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  researchId?: string;
  strategie: string;
  saeulen: ContentPlanResult["saeulen"];
  ideen: ContentIdea[];
};

export type { ViralRating, Script, EditPlan };
