import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Effort, StudioTool } from "./segments";
import { executeStudioTool, studioToolDefinitions } from "./tools";
import { EMPTY_USAGE, type Source, type Usage } from "./types";

export type RunEvent =
  | { type: "status"; kind: "search" | "fetch" | "tool" | "info" | "warn"; text: string }
  | { type: "progress"; text: string }
  | { type: "text"; delta: string }
  /** Der bisher gestreamte Text war ein Zwischenstand (vor einer Recherche) – die UI verschiebt ihn ins Protokoll. */
  | { type: "text_reset" }
  | { type: "final"; content: string; sources: Source[]; usage: Usage; model: string; truncated: boolean };

export interface RunOptions {
  model: string;
  system: Anthropic.Beta.BetaTextBlockParam[];
  userContent: string;
  studioTools: StudioTool[];
  effort: Effort;
  city?: string;
  signal?: AbortSignal;
}

const MAX_ITERATIONS = 15;
const TOOLISH = new Set([
  "tool_use",
  "server_tool_use",
  "web_search_tool_result",
  "web_fetch_tool_result",
]);

export class RunError extends Error {}

function addUsage(total: Usage, u: Anthropic.Beta.BetaUsage) {
  total.inputTokens += u.input_tokens ?? 0;
  total.outputTokens += u.output_tokens ?? 0;
  total.cacheReadTokens += u.cache_read_input_tokens ?? 0;
  total.cacheWriteTokens += u.cache_creation_input_tokens ?? 0;
  total.webSearches += u.server_tool_use?.web_search_requests ?? 0;
  total.webFetches += u.server_tool_use?.web_fetch_requests ?? 0;
}

/**
 * Agenten-Schleife (manueller Tool-Loop mit Streaming):
 * Claude recherchiert mit Websuche/Webabruf (laufen bei Anthropic) und den Studio-Werkzeugen
 * (laufen hier), bis das Ergebnis fertig ist. Jeder Schritt wird als Ereignis an die UI gestreamt.
 */
export async function* runAgent(opts: RunOptions): AsyncGenerator<RunEvent> {
  const client = new Anthropic();
  const tools: Anthropic.Beta.BetaToolUnion[] = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: 10,
      user_location: {
        type: "approximate",
        city: opts.city?.slice(0, 100) || undefined,
        country: "DE",
        timezone: "Europe/Berlin",
      },
    },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: 10, max_content_tokens: 25_000 },
    ...studioToolDefinitions(opts.studioTools),
  ];

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.userContent }];
  const usage: Usage = { ...EMPTY_USAGE };
  const sources = new Map<string, Source>();
  let deliverable = "";
  let model = opts.model;
  let jsonRetries = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const stream = client.beta.messages.stream(
      {
        model: opts.model,
        max_tokens: 64_000,
        betas: ["server-side-fallback-2026-07-01", "thinking-display-updates-2026-08-18"],
        // Bei einer (Fehl-)Ablehnung durch die Sicherheitsfilter springt serverseitig ein passendes Modell ein.
        fallbacks: "default",
        thinking: { type: "adaptive", display: "updates" },
        output_config: { effort: opts.effort },
        cache_control: { type: "ephemeral" },
        system: opts.system,
        tools,
        messages,
      },
      { signal: opts.signal },
    );

    let message: Anthropic.Beta.BetaMessage;
    try {
      for await (const event of stream) {
        if (event.type === "content_block_start") {
          if (TOOLISH.has(event.content_block.type) && deliverable) {
            deliverable = "";
            yield { type: "text_reset" };
          }
        } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          deliverable += event.delta.text;
          yield { type: "text", delta: event.delta.text };
        } else if (event.type === "content_block_stop") {
          const block = stream.currentMessage?.content[event.index];
          if (!block) continue;
          if (block.type === "thinking" && block.thinking.trim()) {
            yield { type: "progress", text: block.thinking.trim() };
          } else if (block.type === "server_tool_use") {
            const input = block.input as { query?: string; url?: string };
            if (block.name === "web_search") yield { type: "status", kind: "search", text: `Websuche: ${input.query ?? ""}` };
            else if (block.name === "web_fetch") yield { type: "status", kind: "fetch", text: `Seite lesen: ${input.url ?? ""}` };
          } else if (block.type === "web_search_tool_result") {
            if (Array.isArray(block.content)) {
              for (const r of block.content) sources.set(r.url, { url: r.url, title: r.title });
            } else {
              yield { type: "status", kind: "warn", text: `Websuche fehlgeschlagen (${block.content.error_code})` };
            }
          } else if (block.type === "web_fetch_tool_result") {
            const c = block.content;
            if (c.type === "web_fetch_result") {
              sources.set(c.url, { url: c.url, title: c.content.title ?? c.url });
            } else {
              yield { type: "status", kind: "warn", text: `Seite nicht abrufbar (${c.error_code})` };
            }
          } else if (block.type === "fallback") {
            yield { type: "status", kind: "info", text: `Sicherheitsfilter: Anfrage läuft auf ${block.to.model} weiter.` };
          }
        }
      }
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // Mit eager_input_streaming kann eine Werkzeug-Eingabe unlesbares JSON sein → Schritt wiederholen.
      if (err instanceof Anthropic.APIError || opts.signal?.aborted || jsonRetries++ >= 2) throw err;
      yield { type: "status", kind: "warn", text: "Werkzeug-Eingabe war unvollständig – Schritt wird wiederholt." };
      if (deliverable) {
        deliverable = "";
        yield { type: "text_reset" };
      }
      continue;
    }

    addUsage(usage, message.usage);
    model = message.model ?? model;
    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");

    switch (message.stop_reason) {
      case "refusal":
        throw new RunError(
          "Die Anfrage wurde von den Sicherheitsfiltern abgelehnt. Formuliere den Auftrag bitte anders oder präziser.",
        );
      case "pause_turn":
        // Serverseitige Recherche hat ihr Schrittlimit erreicht – einfach weitermachen lassen.
        messages.push({ role: "assistant", content: message.content });
        continue;
      case "tool_use": {
        messages.push({ role: "assistant", content: message.content });
        for (const t of toolUses) yield { type: "status", kind: "tool", text: `${t.name} startet …` };
        const outcomes = await Promise.all(toolUses.map((t) => executeStudioTool(t.name, t.input)));
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const [i, outcome] of outcomes.entries()) {
          yield outcome.ok
            ? { type: "status", kind: "tool", text: outcome.status }
            : { type: "status", kind: "warn", text: `${outcome.status} – ${outcome.error}` };
          results.push({
            type: "tool_result",
            tool_use_id: toolUses[i].id,
            content: outcome.ok ? outcome.result : outcome.error,
            ...(outcome.ok ? {} : { is_error: true }),
          });
        }
        // Alle Ergebnisse in einer Nachricht zurückgeben (parallele Werkzeugnutzung bleibt erhalten).
        messages.push({ role: "user", content: results });
        continue;
      }
      case "max_tokens":
      case "model_context_window_exceeded":
        if (toolUses.length) throw new RunError("Die Antwort wurde abgeschnitten, bevor ein Werkzeug fertig beschrieben war.");
        yield { type: "final", content: deliverable.trim(), sources: [...sources.values()], usage, model, truncated: true };
        return;
      default: {
        let content = deliverable.trim();
        if (!content) {
          content = message.content
            .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
            .map((b) => b.text)
            .join("")
            .trim();
        }
        yield { type: "final", content, sources: [...sources.values()], usage, model, truncated: false };
        return;
      }
    }
  }
  throw new RunError("Der Agent hat zu viele Schritte gebraucht und wurde gestoppt. Bitte den Auftrag eingrenzen.");
}

/** Verständliche Fehlermeldungen für die Oberfläche. */
export function describeError(err: unknown): string {
  if (err instanceof RunError) return err.message;
  if (err instanceof Anthropic.AuthenticationError) return "Der Claude-API-Schlüssel fehlt oder ist ungültig (ANTHROPIC_API_KEY).";
  if (err instanceof Anthropic.PermissionDeniedError) return "Der API-Schlüssel hat keinen Zugriff auf dieses Modell oder diese Funktion.";
  if (err instanceof Anthropic.RateLimitError) return "Zu viele Anfragen gleichzeitig (Rate-Limit). Bitte kurz warten und erneut starten.";
  if (err instanceof Anthropic.BadRequestError) return `Anfrage abgelehnt: ${err.message}`;
  if (err instanceof Anthropic.APIConnectionError) return "Keine Verbindung zur Claude-API. Internetverbindung prüfen.";
  if (err instanceof Anthropic.APIError) {
    if (err.status === 529 || err.status === 503) return "Claude ist gerade überlastet. Bitte in ein paar Minuten erneut versuchen.";
    return `Claude-API-Fehler ${err.status ?? ""}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}
