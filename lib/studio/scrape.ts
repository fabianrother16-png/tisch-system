// Scrape-Jobs, die der Browser beim Server anstoßen kann. Bewusst eine feste
// Liste statt freier Actor-Eingaben: So kann niemand über die API beliebige
// (teure) Scraper-Läufe starten.

import { z } from "zod";
import type { CreatorProfile, SocialPost } from "./types";

const handle = z
  .string()
  .trim()
  .transform((s) => s.replace(/^@/, ""))
  .pipe(z.string().regex(/^[A-Za-z0-9._]{1,40}$/, "Ungültiger Account-Name"));

const term = z.string().trim().min(1).max(80);

export const ScrapeJobSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("tiktok-search"),
    queries: z.array(term).min(1).max(6),
    perQuery: z.number().int().min(5).max(50),
    region: z.enum(["DE", "AT", "CH"]),
    recent: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal("tiktok-profiles"),
    handles: z.array(handle).min(1).max(12),
    perProfile: z.number().int().min(3).max(40),
    region: z.enum(["DE", "AT", "CH"]),
    transcripts: z.boolean(),
  }),
  z.object({
    kind: z.literal("instagram-hashtags"),
    hashtags: z.array(term.transform((s) => s.replace(/^#/, "").replace(/\s+/g, ""))).min(1).max(6),
    perTag: z.number().int().min(5).max(50),
  }),
  z.object({
    kind: z.literal("instagram-reels"),
    handles: z.array(handle).min(1).max(12),
    perProfile: z.number().int().min(3).max(40),
    transcripts: z.boolean(),
  }),
  z.object({
    kind: z.literal("instagram-profiles"),
    handles: z.array(handle).min(1).max(40),
  }),
]);

export type ScrapeJob = z.input<typeof ScrapeJobSchema>;
export type ScrapeKind = ScrapeJob["kind"];

export type ScrapeStart = { runId: string; kind: ScrapeKind };

export type ScrapePoll = {
  status: "running" | "done" | "failed";
  message?: string;
  posts?: SocialPost[];
  profiles?: CreatorProfile[];
};
