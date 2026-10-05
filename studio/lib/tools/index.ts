import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { StudioTool } from "../segments";
import { seoCheck } from "./seo-check";
import { pagespeed } from "./pagespeed";
import { googleMapsResearch, instagramResearch, tiktokResearch } from "./apify";

type ToolDef = Anthropic.Beta.BetaTool;

interface StudioToolSpec {
  definition: ToolDef;
  schema: z.ZodType;
  status: (input: never) => string;
  run: (input: never) => Promise<unknown>;
  available: () => boolean;
}

const stringList = z.array(z.string().min(1).max(100)).max(10).optional();

const SPECS: Record<StudioTool, StudioToolSpec> = {
  seo_check: {
    definition: {
      name: "seo_check",
      description:
        "Ruft eine Webseite ab und liefert einen technischen SEO-Basischeck: Statuscode, Weiterleitungen, Ladezeit, Title/Description mit Zeichenzahl, Überschriften, Wortzahl, Textauszug, Bilder ohne Alt-Text, Links, strukturierte Daten, Open Graph, Impressum/Datenschutz-Links, DSGVO-relevante Einbindungen (Google Fonts, Maps, Analytics, Pixel), robots.txt (inkl. gesperrter KI-Crawler), sitemap.xml und llms.txt. Für jede Seite einzeln aufrufen (z. B. Startseite und eine Leistungsseite).",
      input_schema: {
        type: "object",
        properties: { url: { type: "string", description: "Vollständige URL der Seite, z. B. https://beispiel.de/" } },
        required: ["url"],
      },
      eager_input_streaming: true,
    },
    schema: z.object({ url: z.string().min(3).max(2000) }),
    status: (i: { url: string }) => `SEO-Check: ${i.url}`,
    run: (i: { url: string }) => seoCheck(i.url),
    available: () => true,
  },
  pagespeed: {
    definition: {
      name: "pagespeed",
      description:
        "Google PageSpeed Insights für eine URL: Punktwerte (Performance, SEO, Barrierefreiheit, Best Practices), Core-Web-Vitals-Laborwerte, echte Nutzerdaten (falls vorhanden) und die wichtigsten Verbesserungen. Dauert bis zu einer Minute – nur für die wichtigsten Seiten nutzen. Standard ist mobil.",
      input_schema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Vollständige URL" },
          strategy: { type: "string", enum: ["mobile", "desktop"], description: "Standard: mobile" },
        },
        required: ["url"],
      },
      eager_input_streaming: true,
    },
    schema: z.object({ url: z.string().min(3).max(2000), strategy: z.enum(["mobile", "desktop"]).optional() }),
    status: (i: { url: string; strategy?: string }) => `PageSpeed (${i.strategy ?? "mobile"}): ${i.url}`,
    run: (i: { url: string; strategy?: "mobile" | "desktop" }) => pagespeed(i.url, i.strategy),
    available: () => true,
  },
  tiktok_research: {
    definition: {
      name: "tiktok_research",
      description:
        "Holt aktuelle TikTok-Videos mit Kennzahlen (Aufrufe, Likes, Kommentare, Shares, Saves, Dauer, Musik, Hashtags, Link) – nach Hashtags, Suchbegriffen oder Profilen, sortiert nach Aufrufen. Ideal, um zu sehen, was in einer Branche oder Region gerade funktioniert. Kostet pro Abruf Apify-Guthaben: gezielt und sparsam einsetzen (meist reicht ein Abruf mit 2–3 Begriffen).",
      input_schema: {
        type: "object",
        properties: {
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags ohne #, z. B. ['gütersloh', 'frühstück']" },
          searchQueries: { type: "array", items: { type: "string" }, description: "Suchbegriffe wie in der TikTok-Suche, z. B. 'brunch bielefeld'" },
          profiles: { type: "array", items: { type: "string" }, description: "Accountnamen ohne @" },
          limit: { type: "integer", description: "Ergebnisse je Quelle (Standard 15, max. 40)" },
        },
      },
      eager_input_streaming: true,
    },
    schema: z
      .object({ hashtags: stringList, searchQueries: stringList, profiles: stringList, limit: z.number().int().positive().optional() })
      .refine((i) => (i.hashtags?.length ?? 0) + (i.searchQueries?.length ?? 0) + (i.profiles?.length ?? 0) > 0, {
        message: "Mindestens einen Hashtag, Suchbegriff oder ein Profil angeben.",
      }),
    status: (i: { hashtags?: string[]; searchQueries?: string[]; profiles?: string[] }) =>
      `TikTok-Daten: ${[...(i.hashtags ?? []).map((h) => `#${h}`), ...(i.searchQueries ?? []), ...(i.profiles ?? []).map((p) => `@${p}`)].join(", ")}`,
    run: (i: Parameters<typeof tiktokResearch>[0]) => tiktokResearch(i),
    available: () => Boolean(process.env.APIFY_TOKEN),
  },
  instagram_research: {
    definition: {
      name: "instagram_research",
      description:
        "Holt Instagram-Beiträge oder Reels mit Kennzahlen (Likes, Kommentare, Aufrufe, Datum, Caption, Hashtags, Link) von Accounts oder Hashtag-Seiten – oder mit resultsType 'details' die Profildaten (Follower, Anzahl Beiträge, Bio). Kostet Apify-Guthaben: gezielt einsetzen.",
      input_schema: {
        type: "object",
        properties: {
          usernames: { type: "array", items: { type: "string" }, description: "Accountnamen ohne @" },
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags ohne #" },
          resultsType: { type: "string", enum: ["posts", "reels", "details"], description: "Standard: posts" },
          limit: { type: "integer", description: "Ergebnisse je Quelle (Standard 12, max. 40)" },
        },
      },
      eager_input_streaming: true,
    },
    schema: z
      .object({
        usernames: stringList,
        hashtags: stringList,
        resultsType: z.enum(["posts", "reels", "details"]).optional(),
        limit: z.number().int().positive().optional(),
      })
      .refine((i) => (i.usernames?.length ?? 0) + (i.hashtags?.length ?? 0) > 0, {
        message: "Mindestens einen Account oder Hashtag angeben.",
      }),
    status: (i: { usernames?: string[]; hashtags?: string[]; resultsType?: string }) =>
      `Instagram-Daten (${i.resultsType ?? "posts"}): ${[...(i.usernames ?? []).map((u) => `@${u}`), ...(i.hashtags ?? []).map((h) => `#${h}`)].join(", ")}`,
    run: (i: Parameters<typeof instagramResearch>[0]) => instagramResearch(i),
    available: () => Boolean(process.env.APIFY_TOKEN),
  },
  google_maps_research: {
    definition: {
      name: "google_maps_research",
      description:
        "Durchsucht Google Maps nach Betrieben (Suchbegriff + Ort) und liefert Name, Kategorie, Bewertung, Anzahl Bewertungen, Fotos, Adresse, Website, Telefon und Maps-Link. Für Wettbewerbsvergleiche, den Status eines Kunden-Profils oder Lead-Listen (optional nur Betriebe ohne Website). Kostet Apify-Guthaben.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Suchbegriff wie in Google Maps, z. B. 'Friseur' oder 'Café Müller'" },
          location: { type: "string", description: "Ort, z. B. 'Gütersloh, Deutschland'" },
          limit: { type: "integer", description: "Anzahl Betriebe (Standard 15, max. 40)" },
          onlyWithoutWebsite: { type: "boolean", description: "Nur Betriebe ohne Website (für Akquise)" },
        },
        required: ["query", "location"],
      },
      eager_input_streaming: true,
    },
    schema: z.object({
      query: z.string().min(2).max(200),
      location: z.string().min(2).max(200),
      limit: z.number().int().positive().optional(),
      onlyWithoutWebsite: z.boolean().optional(),
    }),
    status: (i: { query: string; location: string }) => `Google-Maps-Daten: „${i.query}" in ${i.location}`,
    run: (i: Parameters<typeof googleMapsResearch>[0]) => googleMapsResearch(i),
    available: () => Boolean(process.env.APIFY_TOKEN),
  },
};

export function availableStudioTools(wanted: StudioTool[]) {
  return wanted.filter((t) => SPECS[t].available());
}

export function studioToolDefinitions(tools: StudioTool[]): ToolDef[] {
  return tools.map((t) => SPECS[t].definition);
}

export function isStudioTool(name: string): name is StudioTool {
  return name in SPECS;
}

export type ToolOutcome = { ok: true; status: string; result: string } | { ok: false; status: string; error: string };

const MAX_RESULT_CHARS = 30_000;

/** Validiert die Eingabe (Pflicht bei eager_input_streaming) und führt das Werkzeug aus. */
export async function executeStudioTool(name: string, rawInput: unknown): Promise<ToolOutcome> {
  if (!isStudioTool(name)) return { ok: false, status: `Unbekanntes Werkzeug ${name}`, error: `Unbekanntes Werkzeug: ${name}` };
  const spec = SPECS[name];
  const parsed = spec.schema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      status: `${name}: ungültige Eingabe`,
      error: `INVALID_INPUT: ${parsed.error.issues.map((i) => i.message).join("; ")} – Eingabe war: ${JSON.stringify(rawInput)}`,
    };
  }
  const status = spec.status(parsed.data as never);
  try {
    const result = await spec.run(parsed.data as never);
    let text = JSON.stringify(result);
    if (text.length > MAX_RESULT_CHARS) text = `${text.slice(0, MAX_RESULT_CHARS)} … [gekürzt]`;
    return { ok: true, status, result: text };
  } catch (err) {
    return { ok: false, status, error: err instanceof Error ? err.message : String(err) };
  }
}
