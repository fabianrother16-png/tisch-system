import { getClient, getOutput, getSettings, newOutput, saveOutput } from "@/lib/db";
import { badRequest, notFound, readJson } from "@/lib/http";
import { costUsd } from "@/lib/models";
import { buildSystem, buildUserMessage } from "@/lib/prompt";
import { describeError, runAgent, type RunEvent } from "@/lib/runtime";
import { getSegment } from "@/lib/segments";
import { availableStudioTools } from "@/lib/tools";
import { isSegmentSlug, type Output, type Usage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Recherchen mit mehreren Werkzeugen dauern; auf Vercel Hobby sind max. 300 s möglich.
export const maxDuration = 300;

type Mode = "neu" | "ueberarbeiten" | "pruefen" | "kundenakte";
type StreamEvent = Exclude<RunEvent, { type: "final" }> | { type: "ping" } | { type: "error"; message: string } | DoneEvent;
interface DoneEvent {
  type: "done";
  outputId: string | null;
  content: string;
  sources: { url: string; title: string }[];
  usage: Usage;
  kostenUsd: number;
  model: string;
  truncated: boolean;
}

function titleFrom(prompt: string) {
  const first = prompt.replace(/\s+/g, " ").trim();
  return first.length > 80 ? `${first.slice(0, 77)}…` : first || "Ergebnis";
}

function addUsage(a: Usage, b: Usage): Usage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    webSearches: a.webSearches + b.webSearches,
    webFetches: a.webFetches + b.webFetches,
  };
}

/**
 * Startet einen Agenten-Lauf und streamt den Fortschritt als NDJSON (eine JSON-Zeile pro Ereignis).
 * Modi: neu (Ergebnis anlegen/füllen) · ueberarbeiten · pruefen (Qualitätsprüfung) · kundenakte (nur Text zurück).
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const mode: Mode = (["neu", "ueberarbeiten", "pruefen", "kundenakte"] as const).includes(body.mode as Mode)
    ? (body.mode as Mode)
    : "neu";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt && mode !== "pruefen") return badRequest("Bitte beschreibe den Auftrag.");
  if (prompt.length > 60_000) return badRequest("Der Auftrag ist zu lang.");

  let existing: Output | null = null;
  if (typeof body.outputId === "string" && body.outputId) {
    existing = await getOutput(body.outputId);
    if (!existing) return notFound("Ergebnis");
  }
  if ((mode === "ueberarbeiten" || mode === "pruefen") && !existing?.content) {
    return badRequest("Für diesen Modus wird ein vorhandenes Ergebnis mit Inhalt benötigt.");
  }

  const segmentSlug =
    mode === "pruefen" ? "qualitaet" : mode === "kundenakte" ? "strategie" : (existing?.segment ?? body.segment);
  if (!isSegmentSlug(segmentSlug)) return badRequest("Unbekanntes Segment.");
  const segment = getSegment(segmentSlug)!;

  const clientId = existing?.clientId ?? (typeof body.clientId === "string" && body.clientId ? body.clientId : null);
  const client = clientId ? await getClient(clientId) : null;
  const settings = await getSettings();
  const studioTools = availableStudioTools(segment.tools);

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return badRequest("Es ist kein Claude-API-Schlüssel hinterlegt. Bitte ANTHROPIC_API_KEY in der .env-Datei bzw. bei Vercel setzen.");
  }

  const system = await buildSystem(segment, settings, studioTools);
  const userContent = buildUserMessage({
    client,
    auftrag:
      mode === "pruefen"
        ? prompt || "Prüfe diesen Inhalt vor der Freigabe an den Kunden."
        : prompt,
    bisherigeVersion: mode === "ueberarbeiten" ? existing!.content : undefined,
    zuPruefen:
      mode === "pruefen"
        ? { titel: existing!.title, segment: getSegment(existing!.segment)?.label ?? existing!.segment, inhalt: existing!.content }
        : undefined,
  });

  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (ev: StreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(ev)}\n`));
        } catch {
          closed = true;
        }
      };
      // Hält die Verbindung offen, während Werkzeuge (z. B. PageSpeed, Apify) arbeiten.
      const ping = setInterval(() => send({ type: "ping" }), 15_000);

      try {
        const run = runAgent({
          model: settings.model,
          system,
          userContent,
          studioTools,
          effort: segment.effort,
          city: client?.ort || settings.agenturOrt,
          signal: abort.signal,
        });
        for await (const ev of run) {
          if (ev.type !== "final") {
            send(ev);
            continue;
          }
          const kosten = costUsd(ev.usage, ev.model);
          let outputId: string | null = null;
          const inhalt = ev.truncated ? `${ev.content}\n\n> ⚠️ Die Antwort wurde wegen ihrer Länge abgeschnitten.` : ev.content;

          if (mode === "neu") {
            const output =
              existing ??
              newOutput({
                segment: segment.slug,
                clientId,
                title: typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 200) : titleFrom(prompt),
              });
            if (output.content && output.content !== inhalt) {
              output.versionen = [{ content: output.content, createdAt: output.updatedAt }, ...output.versionen].slice(0, 10);
            }
            output.prompt = prompt;
            output.content = inhalt;
            output.quellen = ev.sources;
            if (output.status === "offen") output.status = "entwurf";
            output.usage = addUsage(output.usage, ev.usage);
            output.kostenUsd += kosten;
            output.model = ev.model;
            outputId = (await saveOutput(output)).id;
          } else if (mode === "ueberarbeiten" && existing) {
            existing.versionen = [{ content: existing.content, createdAt: existing.updatedAt }, ...existing.versionen].slice(0, 10);
            existing.content = inhalt;
            existing.quellen = [...existing.quellen, ...ev.sources.filter((s) => !existing!.quellen.some((q) => q.url === s.url))];
            existing.usage = addUsage(existing.usage, ev.usage);
            existing.kostenUsd += kosten;
            existing.model = ev.model;
            outputId = (await saveOutput(existing)).id;
          } else if (mode === "pruefen" && existing) {
            existing.pruefbericht = inhalt;
            existing.usage = addUsage(existing.usage, ev.usage);
            existing.kostenUsd += kosten;
            outputId = (await saveOutput(existing)).id;
          }

          send({
            type: "done",
            outputId,
            content: inhalt,
            sources: ev.sources,
            usage: ev.usage,
            kostenUsd: kosten,
            model: ev.model,
            truncated: ev.truncated,
          });
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          console.error("[studio/run]", err);
          send({ type: "error", message: describeError(err) });
        }
      } finally {
        clearInterval(ping);
        closed = true;
        try {
          controller.close();
        } catch {
          /* bereits geschlossen */
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
