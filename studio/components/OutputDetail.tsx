"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Download, Link2, LoaderCircle, Mail, MessageCircle, Play, RefreshCw, Save, Send, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { downloadFile, extractHtml, slugify } from "@/lib/browser";
import { OUTPUT_STATUS_LABEL, formatDate, formatDateTime } from "@/lib/labels";
import { formatUsd } from "@/lib/models";
import { getSegment } from "@/lib/segments";
import { OUTPUT_STATUS, type Output, type OutputStatus } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { Markdown } from "./Markdown";
import { RunView } from "./RunView";
import { SegmentIcon } from "./SegmentIcon";
import { useStudio } from "./StudioContext";
import { useAgentRun } from "./useAgentRun";

type Tab = "ergebnis" | "bearbeiten" | "pruefung" | "versionen" | "quellen" | "feedback";

interface Props {
  output: Output;
  client: { id: string; name: string; ansprechpartner: string } | null;
  clients: { id: string; name: string }[];
  webhook: boolean;
  agenturName: string;
}

export function OutputDetail(props: Props) {
  // Bei jeder Änderung am Ergebnis neu aufbauen – so bleibt der lokale Zustand konsistent.
  return <OutputDetailInner key={props.output.updatedAt} {...props} />;
}

function OutputDetailInner({ output, client, clients, webhook, agenturName }: Props) {
  const router = useRouter();
  const { team } = useStudio();
  const segment = getSegment(output.segment)!;
  const [tab, setTab] = useState<Tab>(output.content ? "ergebnis" : "bearbeiten");
  const [draft, setDraft] = useState(output.content);
  const [title, setTitle] = useState(output.title);
  const [prompt, setPrompt] = useState(output.prompt);
  const [revision, setRevision] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const run = useAgentRun();
  const running = run.state.status === "running";
  const fileBase = slugify(`${output.title}-${client?.name ?? ""}`);
  const html = extractHtml(output.content);
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const link = output.freigabeToken ? `${origin}/freigabe/${output.freigabeToken}` : null;

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/outputs/${output.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  }

  async function runAgent(mode: "neu" | "ueberarbeiten" | "pruefen", p: string) {
    setNotice(null);
    const result = await run.start({ mode, outputId: output.id, prompt: p, segment: output.segment, clientId: output.clientId });
    if (result) router.refresh();
  }

  async function freigabe(method: "POST" | "DELETE") {
    setBusy("freigabe");
    const res = await fetch(`/api/outputs/${output.id}/freigabe`, { method });
    const data = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) setNotice(data.error ?? "Fehler");
    router.refresh();
  }

  async function sendWebhook() {
    setBusy("webhook");
    const res = await fetch(`/api/outputs/${output.id}/webhook`, { method: "POST" });
    const data = (await res.json()) as { error?: string };
    setBusy(null);
    setNotice(res.ok ? "An die Automation gesendet." : (data.error ?? "Fehler"));
  }

  async function remove() {
    if (!window.confirm("Dieses Ergebnis endgültig löschen?")) return;
    await fetch(`/api/outputs/${output.id}`, { method: "DELETE" });
    router.push("/ergebnisse");
    router.refresh();
  }

  const nachricht = link
    ? `Hallo${client?.ansprechpartner ? ` ${client.ansprechpartner.split(/[,(]/)[0].trim()}` : ""}, hier ist „${output.title}“ zur Freigabe: ${link}\nSie können direkt dort freigeben oder Änderungswünsche hinterlassen. Viele Grüße, ${agenturName}`
    : "";

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "ergebnis", label: "Ergebnis", show: Boolean(output.content) },
    { id: "bearbeiten", label: output.content ? "Bearbeiten" : "Auftrag", show: true },
    { id: "pruefung", label: "Prüfbericht", show: Boolean(output.pruefbericht) },
    { id: "feedback", label: `Kunden-Feedback (${output.kundenFeedback.length})`, show: output.kundenFeedback.length > 0 },
    { id: "versionen", label: `Versionen (${output.versionen.length})`, show: output.versionen.length > 0 },
    { id: "quellen", label: `Quellen (${output.quellen.length})`, show: output.quellen.length > 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link href="/ergebnisse" className="text-xs font-semibold text-anthracite/50 hover:text-terracotta-dark">
          ← Ergebnisse
        </Link>
        <div className="mt-1 flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-anthracite text-cream">
            <SegmentIcon slug={output.segment} className="h-5 w-5" />
          </span>
          <input
            className="w-full rounded-lg bg-transparent font-serif text-2xl font-semibold tracking-tight focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 md:text-3xl"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== output.title && patch({ title })}
            aria-label="Titel"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {(run.state.status !== "idle") && <RunView state={run.state} onCancel={run.cancel} filenameBase={fileBase} />}

          {!running && (
            <div className="card overflow-hidden">
              <div className="flex gap-1 overflow-x-auto border-b border-cream-dark px-2 pt-2">
                {tabs
                  .filter((t) => t.show)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm ${tab === t.id ? "bg-cream font-semibold" : "text-anthracite/60 hover:text-anthracite"}`}
                    >
                      {t.label}
                    </button>
                  ))}
              </div>
              <div className="p-4 md:p-6">
                {tab === "ergebnis" && <Markdown content={output.content} filenameBase={fileBase} />}

                {tab === "bearbeiten" && output.content && (
                  <div className="space-y-3">
                    <textarea className="input min-h-[520px] font-mono text-xs leading-relaxed" value={draft} onChange={(e) => setDraft(e.target.value)} />
                    <button className="btn-primary" onClick={() => patch({ content: draft })} disabled={draft === output.content}>
                      <Save className="h-4 w-4" /> Änderungen speichern
                    </button>
                  </div>
                )}

                {tab === "bearbeiten" && !output.content && (
                  <div className="space-y-3">
                    <p className="text-sm text-anthracite/65">
                      Diese Aufgabe ist noch offen. Prüfe den Auftrag (ersetze ggf. [Platzhalter]) und lass den {segment.label}-Agenten arbeiten.
                    </p>
                    <textarea className="input min-h-[200px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    <button className="btn-primary" onClick={() => runAgent("neu", prompt)} disabled={running || !prompt.trim()}>
                      <Play className="h-4 w-4" /> Jetzt erzeugen
                    </button>
                  </div>
                )}

                {tab === "pruefung" && output.pruefbericht && <Markdown content={output.pruefbericht} filenameBase={`${fileBase}-pruefung`} />}

                {tab === "feedback" && (
                  <ul className="space-y-3">
                    {[...output.kundenFeedback].reverse().map((f, i) => (
                      <li key={i} className={`rounded-xl border p-3 text-sm ${f.entscheidung === "freigegeben" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                        <div className="text-xs font-semibold">
                          {f.entscheidung === "freigegeben" ? "Freigegeben" : "Änderungswunsch"} · {formatDateTime(f.createdAt)}
                        </div>
                        {f.text && <p className="mt-1 whitespace-pre-line">{f.text}</p>}
                        {f.entscheidung === "aenderung" && f.text && (
                          <button className="btn-secondary btn-sm mt-2" onClick={() => setRevision(f.text)}>
                            <RefreshCw className="h-3.5 w-3.5" /> Als Überarbeitungswunsch übernehmen
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {tab === "versionen" && (
                  <ul className="space-y-3">
                    {output.versionen.map((v, i) => (
                      <li key={i} className="rounded-xl border border-cream-darker p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold">Version vom {formatDateTime(v.createdAt)}</span>
                          <button className="btn-secondary btn-sm ml-auto" onClick={() => window.confirm("Diese Version wiederherstellen?") && patch({ content: v.content })}>
                            <Undo2 className="h-3.5 w-3.5" /> Wiederherstellen
                          </button>
                        </div>
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-anthracite/70">{v.content.slice(0, 2000)}</pre>
                      </li>
                    ))}
                  </ul>
                )}

                {tab === "quellen" && (
                  <ul className="space-y-1 text-sm">
                    {output.quellen.map((s) => (
                      <li key={s.url} className="truncate">
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-terracotta-dark hover:underline">
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {output.content && !running && (
            <div className="card space-y-3 p-4">
              <label className="label" htmlFor="revision">
                Überarbeiten lassen
              </label>
              <textarea
                id="revision"
                className="input min-h-[72px]"
                placeholder="Was soll anders werden? z. B. „Hooks frecher, Caption kürzer, mehr Bezug zu Gütersloh“"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => runAgent("ueberarbeiten", revision)} disabled={!revision.trim()}>
                  <RefreshCw className="h-4 w-4" /> Überarbeiten
                </button>
                <button className="btn-secondary" onClick={() => runAgent("pruefen", "")}>
                  <ShieldCheck className="h-4 w-4" /> Qualitäts- & Rechtsprüfung
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Seitenleiste */}
        <aside className="space-y-4">
          <div className="card space-y-3 p-4">
            <div>
              <label className="label" htmlFor="status">
                Status
              </label>
              <select id="status" className="input" value={output.status} onChange={(e) => patch({ status: e.target.value as OutputStatus })}>
                {OUTPUT_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {OUTPUT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="kunde">
                Kunde
              </label>
              <select id="kunde" className="input" value={output.clientId ?? ""} onChange={(e) => patch({ clientId: e.target.value || null })}>
                <option value="">Ohne Kunde</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="zustaendig">
                  Zuständig
                </label>
                {team.length ? (
                  <select id="zustaendig" className="input" value={output.zustaendig} onChange={(e) => patch({ zustaendig: e.target.value })}>
                    <option value="">–</option>
                    {team.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id="zustaendig" className="input" defaultValue={output.zustaendig} onBlur={(e) => e.target.value !== output.zustaendig && patch({ zustaendig: e.target.value })} />
                )}
              </div>
              <div>
                <label className="label" htmlFor="geplant">
                  Geplant am
                </label>
                <input id="geplant" type="date" className="input" value={output.geplantAm ?? ""} onChange={(e) => patch({ geplantAm: e.target.value || null })} />
              </div>
            </div>
            <dl className="space-y-1 border-t border-cream-dark pt-3 text-xs text-anthracite/60">
              <div className="flex justify-between gap-2">
                <dt>Segment</dt>
                <dd>
                  <Link href={`/segment/${output.segment}${output.clientId ? `?kunde=${output.clientId}` : ""}`} className="hover:underline">
                    {segment.label}
                  </Link>
                </dd>
              </div>
              {client && (
                <div className="flex justify-between gap-2">
                  <dt>Kunde</dt>
                  <dd>
                    <Link href={`/kunden/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Erstellt</dt>
                <dd>{formatDate(output.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>KI-Kosten</dt>
                <dd>{formatUsd(output.kostenUsd)}</dd>
              </div>
              {output.model && (
                <div className="flex justify-between gap-2">
                  <dt>Modell</dt>
                  <dd>{output.model}</dd>
                </div>
              )}
            </dl>
          </div>

          {output.content && (
            <div className="card space-y-3 p-4">
              <div className="label">Kundenfreigabe</div>
              {link ? (
                <>
                  <input className="input text-xs" readOnly value={link} onFocus={(e) => e.target.select()} />
                  <div className="flex flex-wrap gap-1.5">
                    <CopyButton text={link} label="Link" />
                    <a className="btn-secondary btn-sm" href={`https://wa.me/?text=${encodeURIComponent(nachricht)}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                    <a
                      className="btn-secondary btn-sm"
                      href={`mailto:?subject=${encodeURIComponent(`Zur Freigabe: ${output.title}`)}&body=${encodeURIComponent(nachricht)}`}
                    >
                      <Mail className="h-3.5 w-3.5" /> E-Mail
                    </a>
                    <button className="btn-ghost btn-sm" onClick={() => freigabe("DELETE")} disabled={busy === "freigabe"}>
                      Link widerrufen
                    </button>
                  </div>
                  <p className="text-[11px] text-anthracite/50">Der Kunde sieht nur dieses Ergebnis – ohne Login, ohne interne Infos.</p>
                </>
              ) : (
                <button className="btn-dark w-full" onClick={() => freigabe("POST")} disabled={busy === "freigabe"}>
                  {busy === "freigabe" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Freigabe-Link erstellen
                </button>
              )}
            </div>
          )}

          <div className="card space-y-2 p-4">
            <div className="label">Exportieren</div>
            <div className="flex flex-wrap gap-1.5">
              {output.content && <CopyButton text={output.content} />}
              {output.content && (
                <button className="btn-secondary btn-sm" onClick={() => downloadFile(`${fileBase}.md`, output.content, "text/markdown;charset=utf-8")}>
                  <Download className="h-3.5 w-3.5" /> .md
                </button>
              )}
              {html && (
                <button className="btn-secondary btn-sm" onClick={() => downloadFile(`${fileBase}.html`, html, "text/html;charset=utf-8")}>
                  <Download className="h-3.5 w-3.5" /> .html
                </button>
              )}
              {webhook && output.content && (
                <button className="btn-secondary btn-sm" onClick={sendWebhook} disabled={busy === "webhook"}>
                  <Send className="h-3.5 w-3.5" /> An Automation
                </button>
              )}
            </div>
            {notice && <p className="text-xs text-anthracite/70">{notice}</p>}
          </div>

          <button className="btn-ghost w-full text-red-700 hover:bg-red-50" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Ergebnis löschen
          </button>
        </aside>
      </div>
    </div>
  );
}
