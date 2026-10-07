"use client";

import { useCallback, useRef, useState } from "react";

export type JobContext = {
  note: (text: string) => void;
  progress: (value: number) => void;
  signal: AbortSignal;
};

export type JobState = { busy: boolean; label?: string; note?: string; progress?: number; error?: string };

/** Kleiner Zustandshelfer für lange Aktionen mit Fortschritt und Abbruch. */
export function useJob() {
  const [state, setState] = useState<JobState>({ busy: false });
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async (label: string, fn: (ctx: JobContext) => Promise<void>) => {
    if (controller.current) return false;
    const c = new AbortController();
    controller.current = c;
    setState({ busy: true, label });
    try {
      await fn({
        note: (text) => setState((s) => ({ ...s, note: text })),
        progress: (value) => setState((s) => ({ ...s, progress: value })),
        signal: c.signal,
      });
      setState({ busy: false });
      return true;
    } catch (error) {
      const aborted = c.signal.aborted || (error instanceof DOMException && error.name === "AbortError");
      setState({ busy: false, error: aborted ? undefined : error instanceof Error ? error.message : "Unbekannter Fehler" });
      return false;
    } finally {
      controller.current = null;
    }
  }, []);

  const cancel = useCallback(() => controller.current?.abort(), []);
  const clearError = useCallback(() => setState((s) => ({ ...s, error: undefined })), []);

  return { ...state, run, cancel, clearError };
}
