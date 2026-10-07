// Claude-Anbindung des Studios: strukturierte Ausgaben (garantiert valides
// JSON nach Zod-Schema) und Web-Recherche für die Trendanalyse.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env, requireKey, StudioError } from "./env";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

// Bei einer Ablehnung durch die Sicherheitsklassifikatoren springt die API
// serverseitig automatisch auf das empfohlene Ersatzmodell um.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let cached: Anthropic | null = null;

function anthropic() {
  if (!cached) {
    cached = new Anthropic({
      apiKey: requireKey(env.anthropicKey(), "ANTHROPIC_API_KEY", "ohne Claude gibt es keine Analysen und Skripte"),
      maxRetries: 3,
    });
  }
  return cached;
}

function mapApiError(error: unknown): never {
  if (error instanceof Anthropic.AuthenticationError) {
    throw new StudioError("ANTHROPIC_API_KEY ist ungültig.", 503);
  }
  if (error instanceof Anthropic.RateLimitError) {
    throw new StudioError("Claude ist gerade ausgelastet (Rate-Limit). Bitte in einer Minute erneut versuchen.", 429);
  }
  if (error instanceof Anthropic.BadRequestError) {
    throw new StudioError(`Claude hat die Anfrage abgelehnt: ${error.message}`, 400);
  }
  if (error instanceof Anthropic.APIError) {
    throw new StudioError(`Claude-API-Fehler (${error.status ?? "?"}): ${error.message}`, 502);
  }
  throw error;
}

export type UserContent = string | Anthropic.Beta.BetaContentBlockParam[];

export async function structured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: UserContent;
  effort: Effort;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  let response;
  try {
    response = await anthropic().beta.messages.parse({
      model: env.model(),
      max_tokens: opts.maxTokens ?? 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: opts.content }],
    });
  } catch (error) {
    mapApiError(error);
  }
  if (response.stop_reason === "refusal") {
    throw new StudioError("Die KI hat diese Anfrage aus Sicherheitsgründen abgelehnt. Bitte Eingaben prüfen.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new StudioError("Die Antwort der KI wurde abgeschnitten (zu lang). Bitte erneut versuchen.", 502);
  }
  if (!response.parsed_output) {
    throw new StudioError("Die KI hat keine auswertbare Antwort geliefert. Bitte erneut versuchen.", 502);
  }
  return response.parsed_output as z.infer<S>;
}

export type WebResearch = {
  text: string;
  sources: { title: string; url: string }[];
};

/**
 * Freie Web-Recherche mit dem serverseitigen Websuche-Tool. Liefert die
 * Rechercheergebnisse als Text plus die tatsächlich gefundenen Quellen.
 */
export async function webResearch(opts: {
  system: string;
  prompt: string;
  country: "DE" | "AT" | "CH";
  maxSearches?: number;
}): Promise<WebResearch> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.prompt }];
  const texts: string[] = [];
  const sources = new Map<string, string>();

  for (let round = 0; round < 4; round++) {
    let response;
    try {
      response = await anthropic().beta.messages.create({
        model: env.model(),
        max_tokens: 16000,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: opts.system,
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: opts.maxSearches ?? 6,
            user_location: { type: "approximate", country: opts.country },
          },
        ],
        messages,
      });
    } catch (error) {
      mapApiError(error);
    }

    for (const block of response.content) {
      if (block.type === "text") {
        texts.push(block.text);
        for (const citation of block.citations ?? []) {
          if (citation.type === "web_search_result_location") {
            sources.set(citation.url, citation.title ?? citation.url);
          }
        }
      } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const result of block.content) {
          if (result.type === "web_search_result" && !sources.has(result.url)) {
            sources.set(result.url, result.title);
          }
        }
      }
    }

    if (response.stop_reason === "refusal") {
      throw new StudioError("Die Web-Recherche wurde von der KI abgelehnt.", 422);
    }
    if (response.stop_reason !== "pause_turn") break;
    // Server-seitige Suchschleife pausiert: Antwort zurückgeben, die API
    // setzt automatisch dort fort.
    messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
  }

  return {
    text: texts.join("").trim(),
    sources: [...sources.entries()].map(([url, title]) => ({ url, title })).slice(0, 25),
  };
}

/** Wandelt Data-URLs (JPEG/PNG) in Bild-Blöcke für Claude um. */
export function imageBlock(dataUrl: string): Anthropic.Beta.BetaImageBlockParam | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: match[1] as "image/jpeg" | "image/png" | "image/webp",
      data: match[2],
    },
  };
}
