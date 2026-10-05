"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Download, ExternalLink, Globe, Play, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { downloadFile, slugify } from "@/lib/browser";
import { formatDate } from "@/lib/labels";
import { TOOL_LABELS, getSegment, type StudioTool } from "@/lib/segments";
import type { OutputStatus, SegmentSlug } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { RunView } from "./RunView";
import { SegmentIcon } from "./SegmentIcon";
import { StatusBadge } from "./StatusBadge";
import { useAgentRun } from "./useAgentRun";

interface Props {
  slug: SegmentSlug;
  clients: { id: string; name: string; ort: string }[];
  initialClientId: string;
  initialPrompt?: string;
  autoStart?: boolean;
  task: { id: string; title: string; prompt: string; clientId: string | null } | null;
  tools: { tool: StudioTool; available: boolean }[];
  recent: { id: string; title: string; clientId: string | null; status: OutputStatus; createdAt: string }[];
}

/** Arbeitsplatz eines Segments: Kunde wählen, Auftrag formulieren, Agent arbeiten lassen. */
export function Workspace({ slug, clients, initialClientId, initialPrompt, autoStart, task, tools, recent }: Props) {
  const segment = getSegment(slug)!;
  const router = useRouter();
  const [clientId, setClientId] = useState(initialClientId);
  const [prompt, setPrompt] = useState(initialPrompt ?? task?.prompt ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [outputId, setOutputId] = useState<string | undefined>(task?.id);
  const [revision, setRevision] = useState("");
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const run = useAgentRun();
  const qa = useAgentRun();
  const autoStarted = useRef(false);

  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const running = run.state.status === "running" || qa.state.status === "running";

  async function generate(p = prompt, cId = clientId) {
    if (!p.trim()) return;
    qa.reset();
    const result = await run.start({ segment: slug, clientId: cId || null, prompt: p, title: title || undefined, outputId });
    if (result?.outputId) {
      setOutputId(result.outputId);
      router.refresh();
    }
  }

  // Übergabe von der Befehlszeile auf der Übersicht: Auftrag kommt per URL und startet sofort.
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    router.replace(`/segment/${slug}${initialClientId ? `?kunde=${initialClientId}` : ""}`, { scroll: false });
    void generate(initialPrompt ?? "", initialClientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyQuickAction(label: string, text: string) {
    setPrompt(text);
    setTitle(label);
    setOutputId(undefined);
    requestAnimationFrame(() => {
      const el = promptRef.current;
      if (!el) return;
      el.focus();
      const start = text.indexOf("[");
      const end = text.indexOf("]", start);
      if (start >= 0 && end > start) el.setSelectionRange(start, end + 1);
    });
  }

  function newRun() {
    run.reset();
    qa.reset();
    setOutputId(undefined);
    setTitle("");
    setPrompt("");
    setRevision("");
    promptRef.current?.focus();
  }

  async function revise() {
    if (!outputId || !revision.trim()) return;
    qa.reset();
    const result = await run.start({ mode: "ueberarbeiten", outputId, prompt: revision });
    if (result) {
      setRevision("");
      router.refresh();
    }
  }

  const hasPlaceholder = /\[[^\]]+\]/.test(prompt);
  const fileBase = slugify(`${title || segment.label}-${clientName.get(clientId) ?? ""}`);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-anthracite text-cream">
          <SegmentIcon slug={slug} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="h-page">{segment.label}</h1>
          <p className="text-sm text-anthracite/60">{segment.kurz}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Eingabe */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-4 p-4">
            <div>
              <label className="label" htmlFor="kunde">
                Kunde
              </label>
              <div className="flex gap-2">
                <select id="kunde" className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={running}>
                  <option value="">{segment.ohneKunde ? "Für SICHTWERK selbst" : "Ohne Kunde (allgemein)"}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.ort ? ` – ${c.ort}` : ""}
                    </option>
                  ))}
                </select>
                {clientId && (
                  <Link href={`/kunden/${clientId}`} className="btn-secondary px-3" title="Kundenakte öffnen">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
              {!clientId && !segment.ohneKunde && clients.length === 0 && (
                <p className="mt-1 text-xs text-anthracite/55">
                  Tipp: <Link href="/kunden/neu" className="underline">Kunden anlegen</Link> – dann kennt jeder Agent Branche, Ort, Zielgruppe und Ton.
                </p>
              )}
            </div>

            <div>
              <div className="label">Schnellstart</div>
              <div className="flex flex-wrap gap-1.5">
                {segment.quickActions.map((q) => (
                  <button key={q.label} className="chip hover:border-terracotta/60 hover:text-terracotta-dark" onClick={() => applyQuickAction(q.label, q.prompt)} disabled={running}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="auftrag">
                Auftrag
              </label>
              <textarea
                id="auftrag"
                ref={promptRef}
                className="input min-h-[160px] resize-y"
                placeholder="Beschreibe, was der Agent bauen soll …"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void generate();
                }}
                disabled={running}
              />
              {hasPlaceholder && <p className="mt-1 text-xs text-terracotta-dark">Bitte die [Platzhalter] im Auftrag ersetzen.</p>}
            </div>

            <div>
              <label className="label" htmlFor="titel">
                Titel des Ergebnisses <span className="font-normal normal-case text-anthracite/40">(optional)</span>
              </label>
              <input id="titel" className="input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={running} placeholder="wird sonst aus dem Auftrag erzeugt" />
            </div>

            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => generate()} disabled={running || !prompt.trim()}>
                <Play className="h-4 w-4" /> {outputId && task ? "Aufgabe erzeugen" : "Erzeugen"}
              </button>
              {(run.state.status !== "idle" || outputId) && (
                <button className="btn-secondary" onClick={newRun} disabled={running} title="Neuer Auftrag">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-anthracite/45">Strg/⌘ + Enter startet ebenfalls.</p>
          </div>

          <div className="card p-4">
            <div className="label">Datenquellen dieses Agenten</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip">
                <Search className="h-3 w-3 text-emerald-600" /> Websuche
              </span>
              <span className="chip">
                <Globe className="h-3 w-3 text-emerald-600" /> Webseiten lesen
              </span>
              {tools.map(({ tool, available }) => (
                <span key={tool} className={`chip ${available ? "" : "opacity-50"}`} title={available ? "verbunden" : "nicht verbunden – siehe Einstellungen"}>
                  {available ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3" />}
                  {TOOL_LABELS[tool]}
                </span>
              ))}
            </div>
          </div>

          {recent.length > 0 && (
            <div className="card p-4">
              <div className="label">Letzte Ergebnisse</div>
              <ul className="space-y-1">
                {recent
                  .filter((r) => !clientId || r.clientId === clientId)
                  .slice(0, 8)
                  .map((r) => (
                    <li key={r.id}>
                      <Link href={`/ergebnisse/${r.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-cream">
                        <span className="min-w-0 flex-1 truncate">
                          {r.title}
                          <span className="block text-[11px] text-anthracite/50">
                            {clientName.get(r.clientId ?? "") ?? "ohne Kunde"} · {formatDate(r.createdAt)}
                          </span>
                        </span>
                        <StatusBadge status={r.status} />
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Ausgabe */}
        <div className="min-w-0 space-y-6">
          {run.state.status === "idle" && (
            <div className="card flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-dark text-terracotta">
                <SegmentIcon slug={slug} className="h-7 w-7" />
              </span>
              <h2 className="font-serif text-xl font-semibold">Bereit.</h2>
              <p className="max-w-md text-sm text-anthracite/60">
                Wähle einen Kunden und einen Schnellstart oder beschreibe frei, was du brauchst. Der Agent recherchiert selbstständig, nutzt die
                Kundenakte und liefert ein fertiges Ergebnis, das automatisch unter „Ergebnisse“ gespeichert wird.
              </p>
            </div>
          )}

          <RunView state={run.state} onCancel={run.cancel} filenameBase={fileBase}>
            {run.state.result && (
              <div className="card space-y-4 p-4">
                <div className="flex flex-wrap gap-2">
                  {run.state.result.outputId && (
                    <Link href={`/ergebnisse/${run.state.result.outputId}`} className="btn-dark">
                      <ExternalLink className="h-4 w-4" /> Ergebnis öffnen & freigeben
                    </Link>
                  )}
                  <CopyButton text={run.state.result.content} className="btn-secondary" />
                  <button className="btn-secondary" onClick={() => downloadFile(`${fileBase}.md`, run.state.result!.content, "text/markdown;charset=utf-8")}>
                    <Download className="h-4 w-4" /> .md
                  </button>
                  {outputId && (
                    <button
                      className="btn-secondary"
                      disabled={running}
                      onClick={() => qa.start({ mode: "pruefen", outputId, prompt: "" }).then(() => router.refresh())}
                    >
                      <ShieldCheck className="h-4 w-4" /> Qualitätsprüfung
                    </button>
                  )}
                </div>
                {outputId && (
                  <div>
                    <label className="label" htmlFor="ueberarbeiten">
                      Überarbeiten lassen
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="ueberarbeiten"
                        className="input"
                        placeholder="z. B. kürzer, lockerer, mehr Fokus auf Mittagstisch …"
                        value={revision}
                        onChange={(e) => setRevision(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void revise();
                        }}
                      />
                      <button className="btn-primary" onClick={revise} disabled={running || !revision.trim()}>
                        <RefreshCw className="h-4 w-4" /> Überarbeiten
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </RunView>

          {qa.state.status !== "idle" && (
            <div>
              <h2 className="h-section mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-terracotta" /> Qualitätsprüfung
              </h2>
              <RunView state={qa.state} onCancel={qa.cancel} filenameBase={`${fileBase}-pruefung`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
