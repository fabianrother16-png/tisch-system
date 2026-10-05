"use client";

import { useCallback, useRef, useState } from "react";
import type { Source, Usage } from "@/lib/types";

export type LogKind = "search" | "fetch" | "tool" | "info" | "warn" | "progress" | "note";

export interface LogItem {
  kind: LogKind;
  text: string;
  at: number;
}

export interface RunResult {
  outputId: string | null;
  content: string;
  sources: Source[];
  usage: Usage;
  kostenUsd: number;
  model: string;
  truncated: boolean;
}

export interface RunState {
  status: "idle" | "running" | "done" | "error";
  log: LogItem[];
  text: string;
  result: RunResult | null;
  error: string | null;
  startedAt: number | null;
}

export interface RunRequest {
  segment?: string;
  clientId?: string | null;
  prompt: string;
  outputId?: string;
  title?: string;
  mode?: "neu" | "ueberarbeiten" | "pruefen" | "kundenakte";
}

const INITIAL: RunState = { status: "idle", log: [], text: "", result: null, error: null, startedAt: null };

type Incoming =
  | { type: "status"; kind: LogKind; text: string }
  | { type: "progress"; text: string }
  | { type: "text"; delta: string }
  | { type: "text_reset" }
  | { type: "ping" }
  | { type: "error"; message: string }
  | ({ type: "done" } & RunResult);

/** Startet einen Agenten-Lauf über /api/run und verarbeitet den NDJSON-Stream. */
export function useAgentRun() {
  const [state, setState] = useState<RunState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (req: RunRequest): Promise<RunResult | null> => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setState({ ...INITIAL, status: "running", startedAt: Date.now() });

    const push = (item: Omit<LogItem, "at">) => setState((s) => ({ ...s, log: [...s.log, { ...item, at: Date.now() }] }));
    let result: RunResult | null = null;

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
        signal: abort.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Fehler ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Text-Deltas sammeln und gebündelt rendern (schont die Markdown-Darstellung).
      let pending = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;
      const flush = () => {
        flushTimer = null;
        if (!pending) return;
        const add = pending;
        pending = "";
        setState((s) => ({ ...s, text: s.text + add }));
      };

      const handle = (ev: Incoming) => {
        switch (ev.type) {
          case "text":
            pending += ev.delta;
            flushTimer ??= setTimeout(flush, 80);
            break;
          case "text_reset":
            if (flushTimer) clearTimeout(flushTimer);
            flushTimer = null;
            pending = "";
            setState((s) => {
              const note = s.text.trim();
              return {
                ...s,
                text: "",
                log: note ? [...s.log, { kind: "note", text: note.length > 400 ? `${note.slice(0, 400)}…` : note, at: Date.now() }] : s.log,
              };
            });
            break;
          case "status":
            push({ kind: ev.kind, text: ev.text });
            break;
          case "progress":
            push({ kind: "progress", text: ev.text });
            break;
          case "error":
            throw new Error(ev.message);
          case "done": {
            if (flushTimer) clearTimeout(flushTimer);
            const { type: _t, ...r } = ev;
            result = r;
            setState((s) => ({ ...s, status: "done", text: r.content, result: r }));
            break;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) handle(JSON.parse(line) as Incoming);
        }
      }
      if (!result) throw new Error("Die Verbindung wurde beendet, bevor das Ergebnis fertig war.");
      return result;
    } catch (err) {
      if (abort.signal.aborted) {
        setState((s) => ({ ...s, status: "error", error: "Abgebrochen." }));
      } else {
        setState((s) => ({ ...s, status: "error", error: err instanceof Error ? err.message : String(err) }));
      }
      return null;
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => setState(INITIAL), []);

  return { state, start, cancel, reset };
}
