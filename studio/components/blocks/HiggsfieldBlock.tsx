"use client";

import { Clapperboard, ExternalLink, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "../CopyButton";
import { useStudio } from "../StudioContext";
import { CodeBlock } from "./CodeBlock";

interface HfJob {
  model: string;
  prompt?: string;
  [key: string]: unknown;
}

interface HfStatus {
  status: string;
  request_id: string;
  error?: string | null;
  video?: { url: string };
  images?: { url: string }[];
}

const TERMINAL = new Set(["completed", "failed", "nsfw", "canceled"]);
const STATUS_LABEL: Record<string, string> = {
  queued: "In der Warteschlange …",
  in_progress: "Wird erzeugt …",
  completed: "Fertig",
  failed: "Fehlgeschlagen",
  nsfw: "Von der Moderation abgelehnt",
  canceled: "Abgebrochen",
};

/** Ein Higgsfield-Auftrag aus der Agenten-Ausgabe: Prompt anzeigen, kopieren oder direkt erzeugen. */
export function HiggsfieldBlock({ json }: { json: string }) {
  const { higgsfield, oeffentlich } = useStudio();
  const job = useMemo<HfJob | null>(() => {
    try {
      const parsed = JSON.parse(json) as HfJob;
      return parsed && typeof parsed.model === "string" ? parsed : null;
    } catch {
      return null;
    }
  }, [json]);
  const [state, setState] = useState<HfStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!job) return <CodeBlock code={json} lang="higgsfield (ungültiges JSON)" />;
  const { model, prompt, ...rest } = job;
  const isVideo = model.includes("video");

  async function poll(id: string, delay = 3000) {
    try {
      const res = await fetch(`/api/higgsfield?id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as HfStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`);
      setState(data);
      if (!TERMINAL.has(data.status)) timer.current = setTimeout(() => poll(id, Math.min(delay * 1.4, 10000)), delay);
      else setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function start() {
    if (!window.confirm("Das verbraucht Higgsfield-Credits. Jetzt erzeugen?")) return;
    setBusy(true);
    setError(null);
    setState(null);
    try {
      const { model: m, ...input } = job!;
      const res = await fetch("/api/higgsfield", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: m, input }),
      });
      const data = (await res.json()) as HfStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`);
      setState(data);
      void poll(data.request_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const mediaUrl = state?.video?.url ?? state?.images?.[0]?.url;

  if (oeffentlich) {
    return (
      <div className="not-prose my-4 rounded-2xl border border-cream-darker bg-cream/50 p-3 text-sm">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-anthracite/55">{isVideo ? "Geplante KI-Videoszene" : "Geplantes KI-Bild"}</div>
        {prompt}
      </div>
    );
  }

  return (
    <div className="not-prose my-4 overflow-hidden rounded-2xl border border-terracotta/30 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-terracotta/20 bg-terracotta/5 px-3 py-2">
        <Clapperboard className="h-4 w-4 text-terracotta" />
        <span className="text-xs font-semibold uppercase tracking-wide text-terracotta-dark">Higgsfield · {isVideo ? "KI-Video" : "KI-Bild"}</span>
        <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-anthracite/70">{model}</code>
        {Object.entries(rest).map(([k, v]) => (
          <span key={k} className="chip !py-0.5 text-[11px]">
            {k}: {String(v)}
          </span>
        ))}
      </div>
      <div className="space-y-3 p-3">
        {prompt && <p className="text-sm leading-relaxed text-anthracite/90">{prompt}</p>}
        <div className="flex flex-wrap gap-2">
          {prompt && <CopyButton text={prompt} label="Prompt kopieren" />}
          <CopyButton text={json} label="JSON kopieren" />
          {higgsfield ? (
            <button className="btn-primary btn-sm" onClick={start} disabled={busy}>
              {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Mit Higgsfield erzeugen
            </button>
          ) : (
            <span className="text-xs text-anthracite/50">Higgsfield-API nicht verbunden – Prompt kopieren und in Higgsfield einfügen.</span>
          )}
        </div>
        {state && (
          <div className="text-xs text-anthracite/70">
            Status: <strong>{STATUS_LABEL[state.status] ?? state.status}</strong>
            {state.error ? ` – ${state.error}` : ""}
          </div>
        )}
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}
        {mediaUrl && (
          <div className="space-y-2">
            {state?.video ? (
              <video src={mediaUrl} controls playsInline className="max-h-[520px] rounded-xl bg-anthracite" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt={prompt ?? "Higgsfield-Bild"} className="max-h-[520px] rounded-xl" />
            )}
            <a href={mediaUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
              <ExternalLink className="h-3.5 w-3.5" /> Datei öffnen (mind. 7 Tage verfügbar – bitte sichern)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
