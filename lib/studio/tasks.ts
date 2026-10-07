// Gemeinsame Definition aller KI-Aufgaben: Eingabe-Schemas (werden auf dem
// Server validiert) und Ausgabe-Typen. Die Prompts selbst liegen in
// lib/studio/server/tasks.ts.

import { z } from "zod";
import {
  ClipFinderSchema,
  CompetitorAnalysisSchema,
  ContentPlanResultSchema,
  EditPlanSchema,
  HookLabSchema,
  MainAnalysisSchema,
  ScriptSchema,
  SearchPlanSchema,
  SelectionSchema,
  SynthesisSchema,
  TrendReportSchema,
  ViralRatingSchema,
} from "./schemas";

export const ClientBriefSchema = z.object({
  name: z.string().max(200),
  branche: z.string().max(300),
  zielgruppe: z.string().max(500),
  stadt: z.string().max(200),
  region: z.enum(["DE", "AT", "CH"]),
  plattformen: z.array(z.enum(["tiktok", "instagram"])),
  ziel: z.enum(["reichweite", "kunden", "recruiting", "marke"]),
  usp: z.string().max(1500),
  tonalitaet: z.string().max(500),
  cta: z.string().max(300),
  notizen: z.string().max(3000),
});
export type ClientBrief = z.infer<typeof ClientBriefSchema>;

export const PostInputSchema = z.object({
  id: z.string(),
  platform: z.enum(["tiktok", "instagram"]),
  author: z.string(),
  caption: z.string().max(3000),
  hashtags: z.array(z.string()).max(60),
  views: z.number(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  saves: z.number(),
  durationSec: z.number().optional(),
  postedAt: z.string().optional(),
  sound: z.object({ name: z.string(), author: z.string().optional(), original: z.boolean() }).optional(),
  transcript: z.string().max(6000).optional(),
  isVideo: z.boolean(),
  isPinned: z.boolean().optional(),
});
export type PostInput = z.infer<typeof PostInputSchema>;

const ProfileInputSchema = z.object({
  key: z.string(),
  platform: z.enum(["tiktok", "instagram"]),
  handle: z.string(),
  name: z.string().optional(),
  followers: z.number().optional(),
  bio: z.string().max(1000).optional(),
  verified: z.boolean().optional(),
});

const StatsInputSchema = z.object({
  count: z.number(),
  medianViews: z.number(),
  avgViews: z.number(),
  maxViews: z.number(),
  engagementRate: z.number(),
  postsPerWeek: z.number().nullable(),
  avgDuration: z.number().nullable(),
  outliers: z.number(),
});

const CandidateInputSchema = z.object({
  key: z.string(),
  platform: z.enum(["tiktok", "instagram"]),
  handle: z.string(),
  name: z.string().optional(),
  followers: z.number().optional(),
  bio: z.string().max(500).optional(),
  postCount: z.number(),
  medianViews: z.number(),
  maxViews: z.number(),
  engagementRate: z.number(),
  score: z.number(),
  beispiele: z.array(z.string().max(400)).max(5),
});

const WordInputSchema = z.object({ text: z.string(), start: z.number(), end: z.number() });

const FramesSchema = z
  .array(
    z.object({
      t: z.number(),
      source: z.string(),
      dataUrl: z.string().max(400_000),
    }),
  )
  .max(16);

const SourceInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  kind: z.enum(["video", "audio", "image"]),
  words: z.array(WordInputSchema).max(8000),
});

export const AI_TASKS = {
  plan: {
    input: z.object({ client: ClientBriefSchema, thema: z.string().max(500) }),
    output: SearchPlanSchema,
  },
  select: {
    input: z.object({
      client: ClientBriefSchema,
      plan: SearchPlanSchema,
      candidates: z.array(CandidateInputSchema).max(40),
      anzahl: z.number().min(1).max(10),
    }),
    output: SelectionSchema,
  },
  analyzeMain: {
    input: z.object({
      client: ClientBriefSchema,
      profile: ProfileInputSchema,
      stats: StatsInputSchema,
      posts: z.array(PostInputSchema).max(40),
    }),
    output: MainAnalysisSchema,
  },
  draft: {
    input: z.object({
      client: ClientBriefSchema,
      thema: z.string().max(500),
      konkurrent: z.string(),
      analyse: MainAnalysisSchema,
    }),
    output: ScriptSchema,
  },
  analyzeCompetitor: {
    input: z.object({
      client: ClientBriefSchema,
      profile: ProfileInputSchema,
      stats: StatsInputSchema,
      posts: z.array(PostInputSchema).max(30),
    }),
    output: CompetitorAnalysisSchema,
  },
  synthesize: {
    input: z.object({
      client: ClientBriefSchema,
      haupt: z.object({ handle: z.string(), analyse: MainAnalysisSchema, stats: StatsInputSchema }),
      konkurrenten: z
        .array(z.object({ handle: z.string(), analyse: CompetitorAnalysisSchema, stats: StatsInputSchema }))
        .max(12),
    }),
    output: SynthesisSchema,
  },
  trends: {
    input: z.object({
      client: ClientBriefSchema,
      nische: z.string(),
      suchbegriffe: z.array(z.string()).max(12),
      datenTrends: z.object({
        hashtags: z.array(z.object({ tag: z.string(), posts: z.number(), views: z.number(), generic: z.boolean() })).max(40),
        sounds: z
          .array(z.object({ name: z.string(), author: z.string().optional(), posts: z.number(), views: z.number(), platform: z.string() }))
          .max(30),
        lengths: z.array(z.object({ bucket: z.string(), posts: z.number(), medianViews: z.number() })),
        weekdays: z.array(z.object({ day: z.string(), posts: z.number(), medianViews: z.number() })),
        hours: z.array(z.object({ hour: z.number(), posts: z.number(), medianViews: z.number() })),
        recentViral: z.array(PostInputSchema).max(15),
        analysedPosts: z.number(),
      }),
      webRecherche: z.boolean(),
    }),
    output: TrendReportSchema,
  },
  final: {
    input: z.object({
      client: ClientBriefSchema,
      thema: z.string().max(500),
      entwurf: ScriptSchema,
      hauptAnalyse: MainAnalysisSchema,
      synthese: SynthesisSchema.nullable(),
      konkurrenten: z.array(z.object({ handle: z.string(), analyse: CompetitorAnalysisSchema })).max(12),
      trends: TrendReportSchema.nullable(),
    }),
    output: ScriptSchema,
  },
  editPlan: {
    input: z.object({
      client: ClientBriefSchema,
      skript: ScriptSchema.nullable(),
      wunsch: z.string().max(1000),
      zielLaenge: z.number().min(5).max(180),
      quellen: z.array(SourceInputSchema).min(1).max(20),
      frames: FramesSchema,
    }),
    output: EditPlanSchema,
  },
  rateVideo: {
    input: z.object({
      client: ClientBriefSchema,
      kontext: z.string().max(4000),
      dauer: z.number(),
      woerter: z.array(WordInputSchema).max(8000),
      hookText: z.string().max(300),
      frames: FramesSchema,
    }),
    output: ViralRatingSchema,
  },
  contentPlan: {
    input: z.object({
      client: ClientBriefSchema,
      anzahl: z.number().min(5).max(30),
      erkenntnisse: z.string().max(20000),
    }),
    output: ContentPlanResultSchema,
  },
  ideaScript: {
    input: z.object({
      client: ClientBriefSchema,
      idee: z.object({
        titel: z.string(),
        hook: z.string(),
        format: z.string(),
        saeule: z.string(),
        ziel: z.string(),
        plattform: z.enum(["tiktok", "instagram", "beide"]),
      }),
      erkenntnisse: z.string().max(20000),
    }),
    output: ScriptSchema,
  },
  hookLab: {
    input: z.object({
      client: ClientBriefSchema,
      thema: z.string().max(2000),
      bisherigerHook: z.string().max(500),
      erkenntnisse: z.string().max(20000),
    }),
    output: HookLabSchema,
  },
  clipFinder: {
    input: z.object({
      client: ClientBriefSchema,
      dauer: z.number(),
      anzahl: z.number().min(1).max(8),
      woerter: z.array(WordInputSchema).max(20000),
    }),
    output: ClipFinderSchema,
  },
} as const;

export type AiTaskName = keyof typeof AI_TASKS;
export type AiTaskInput<N extends AiTaskName> = z.infer<(typeof AI_TASKS)[N]["input"]>;
export type AiTaskOutput<N extends AiTaskName> = N extends "trends"
  ? z.infer<typeof TrendReportSchema> & { quellen: { title: string; url: string }[] }
  : z.infer<(typeof AI_TASKS)[N]["output"]>;

export function toBrief(client: {
  name: string;
  branche: string;
  zielgruppe: string;
  stadt: string;
  region: "DE" | "AT" | "CH";
  plattformen: ("tiktok" | "instagram")[];
  ziel: "reichweite" | "kunden" | "recruiting" | "marke";
  usp: string;
  tonalitaet: string;
  cta: string;
  notizen: string;
}): ClientBrief {
  return {
    name: client.name,
    branche: client.branche,
    zielgruppe: client.zielgruppe || "alle",
    stadt: client.stadt,
    region: client.region,
    plattformen: client.plattformen,
    ziel: client.ziel,
    usp: client.usp,
    tonalitaet: client.tonalitaet,
    cta: client.cta,
    notizen: client.notizen,
  };
}
