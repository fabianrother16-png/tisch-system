"use client";

import { ChevronDown, CircleAlert, FileSearch, Globe, Info, LoaderCircle, MessageSquareText, Search, Square, TriangleAlert, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/models";
import { Markdown } from "./Markdown";
import type { LogKind, RunState } from "./useAgentRun";

const LOG_ICON: Record<LogKind, typeof Search> = {
  search: Search,
  fetch: Globe,
  tool: Wrench,
  info: Info,
  warn: TriangleAlert,
  progress: MessageSquareText,
  note: FileSearch,
};

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.round((now - since) / 1000));
  return <span className="tabular-nums">{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</span>;
}

/** Zeigt einen laufenden bzw. fertigen Agenten-Lauf: Arbeitsschritte + Ergebnis. */
export function RunView({
  state,
  onCancel,
  filenameBase,
  children,
}: {
  state: RunState;
  onCancel?: () => void;
  filenameBase?: string;
  children?: React.ReactNode;
}) {
  const [logOpen, setLogOpen] = useState(true);
  const [prevStatus, setPrevStatus] = useState(state.status);
  const running = state.status === "running";

  // Protokoll beim Start aufklappen, nach Abschluss zuklappen (abgeleiteter Zustand).
  if (prevStatus !== state.status) {
    setPrevStatus(state.status);
    if (state.status === "done") setLogOpen(false);
    if (state.status === "running") setLogOpen(true);
  }

  if (state.status === "idle") return null;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setLogOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
          aria-expanded={logOpen}
        >
          {running ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-terracotta" />
          ) : state.status === "error" ? (
            <CircleAlert className="h-4 w-4 text-red-700" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          )}
          <span className="text-sm font-semibold">
            {running ? "Agent arbeitet" : state.status === "error" ? "Abgebrochen" : "Fertig"}
            <span className="ml-2 font-normal text-anthracite/60">
              {state.log.length} Arbeitsschritte
              {state.startedAt && running && (
                <>
                  {" · "}
                  <Elapsed since={state.startedAt} />
                </>
              )}
              {state.result && ` · ${formatUsd(state.result.kostenUsd)} · ${state.result.model}`}
            </span>
          </span>
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${logOpen ? "rotate-180" : ""}`} />
        </button>
        {logOpen && (state.log.length > 0 || running) && (
          <ol className="max-h-72 space-y-1.5 overflow-y-auto border-t border-cream-dark px-4 py-3 text-xs">
            {state.log.map((item, i) => {
              const Icon = LOG_ICON[item.kind];
              return (
                <li key={i} className={`flex gap-2 ${item.kind === "warn" ? "text-amber-800" : "text-anthracite/75"}`}>
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className={`${item.kind === "progress" || item.kind === "note" ? "italic" : ""} whitespace-pre-line break-words`}>{item.text}</span>
                </li>
              );
            })}
            {running && state.log.length === 0 && <li className="text-anthracite/50">Verbinde mit Claude und lese Kundenakte …</li>}
          </ol>
        )}
        {running && onCancel && (
          <div className="border-t border-cream-dark px-4 py-2">
            <button className="btn-ghost btn-sm" onClick={onCancel}>
              <Square className="h-3 w-3" /> Abbrechen
            </button>
          </div>
        )}
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</div>
      )}

      {state.text && (
        <div className="card p-5 md:p-7">
          <Markdown content={state.text} streaming={running} filenameBase={filenameBase} />
          {running && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-terracotta align-middle" />}
        </div>
      )}

      {state.status === "done" && state.result && state.result.sources.length > 0 && (
        <details className="card px-4 py-3 text-sm">
          <summary className="cursor-pointer font-semibold">Quellen ({state.result.sources.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {state.result.sources.map((s) => (
              <li key={s.url} className="truncate">
                <a href={s.url} target="_blank" rel="noreferrer" className="text-terracotta-dark underline-offset-2 hover:underline">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {state.status === "done" && children}
    </div>
  );
}
