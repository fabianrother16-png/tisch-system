"use client";

// Browser-Seite der Studio-API: hängt das Studio-Passwort an, wertet Fehler
// einheitlich aus und stellt Polling-Helfer für lange Jobs bereit.

import type { ScrapeJob, ScrapePoll, ScrapeStart } from "./scrape";
import type { ProviderStatus } from "./server/env";
import type { AiTaskInput, AiTaskName, AiTaskOutput } from "./tasks";

const KEY_STORAGE = "sichtwerk-studio-key";

export function getStudioKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setStudioKey(key: string) {
  try {
    localStorage.setItem(KEY_STORAGE, key);
  } catch {
    // Privater Modus o. Ä. – dann gilt das Passwort nur für diese Sitzung.
  }
  memoryKey = key;
}

let memoryKey = "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-studio-key", getStudioKey() || memoryKey);
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError("Keine Verbindung zum Server.", 0);
  }
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Vercel liefert bei Timeouts/zu großen Bodies HTML oder Klartext.
    if (response.status === 413) {
      throw new ApiError("Datei zu groß für den Upload (max. ca. 4 MB pro Anfrage).", 413);
    }
    if (response.status === 504) {
      throw new ApiError("Zeitüberschreitung auf dem Server. Bitte erneut versuchen.", 504);
    }
    throw new ApiError(`Unerwartete Server-Antwort (${response.status}).`, response.status);
  }
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : `Fehler ${response.status}`;
    if (response.status === 401) window.dispatchEvent(new Event("studio:unauthorized"));
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export type StatusResponse = ProviderStatus & { authorized: boolean };

export function fetchStatus() {
  return api<StatusResponse>("/api/studio/status");
}

/** Führt eine KI-Aufgabe aus (siehe lib/studio/tasks.ts). */
export function runAi<N extends AiTaskName>(task: N, input: AiTaskInput<N>, signal?: AbortSignal) {
  return api<AiTaskOutput<N>>("/api/studio/ai", {
    method: "POST",
    body: JSON.stringify({ task, input }),
    signal,
  });
}

/**
 * Startet einen Scraper-Lauf und pollt, bis Ergebnisse da sind. TikTok-/
 * Instagram-Läufe dauern typischerweise 30 Sekunden bis wenige Minuten.
 */
export async function runScrape(
  job: ScrapeJob,
  opts: { signal?: AbortSignal; onTick?: (elapsedSec: number, message?: string) => void; timeoutMin?: number } = {},
): Promise<ScrapePoll> {
  const start = await api<ScrapeStart>("/api/studio/scrape", {
    method: "POST",
    body: JSON.stringify({ job }),
    signal: opts.signal,
  });
  const began = Date.now();
  const deadline = began + (opts.timeoutMin ?? 12) * 60_000;
  let delay = 4000;
  while (Date.now() < deadline) {
    await sleep(delay, opts.signal);
    delay = Math.min(delay + 1000, 8000);
    const params = new URLSearchParams({ runId: start.runId, kind: start.kind });
    const poll = await api<ScrapePoll>(`/api/studio/scrape?${params}`, { signal: opts.signal });
    opts.onTick?.(Math.round((Date.now() - began) / 1000), poll.message);
    if (poll.status === "done") return poll;
    if (poll.status === "failed") throw new ApiError(poll.message || "Scraper-Lauf fehlgeschlagen.", 502);
  }
  throw new ApiError("Der Scraper-Lauf dauert ungewöhnlich lange. Bitte später erneut versuchen.", 504);
}

export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Abgebrochen", "AbortError"));
    });
  });
}

/** Führt `items` mit begrenzter Parallelität aus. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
