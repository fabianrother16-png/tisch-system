"use client";

import { Mic, RefreshCcw, Upload, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, mapLimit } from "@/lib/studio/api";
import { update, useAssetUrl } from "@/lib/studio/db";
import type { MediaSource, VideoProject } from "@/lib/studio/types";
import { VIDEO_MODELS, type VideoModelId } from "@/lib/studio/videoModels";
import { addUploads, createVoiceover, generateScene, resumeScene, sceneSeconds, settingsOf } from "@/lib/studio/video/workflow";
import { ScriptView } from "../ScriptView";
import { useStudioStatus } from "../StudioShell";
import { Badge, Btn, Card, ErrorNote, Field, InfoNote, Select, Spinner, TextArea } from "../ui";
import { useJob } from "./useJob";

type Voice = { id: string; name: string; labels: Record<string, string>; previewUrl?: string };

export function AiScenesPanel({ project }: { project: VideoProject }) {
  const { status } = useStudioStatus();
  const script = project.script;
  if (!script) {
    return (
      <Card>
        <p className="text-sm text-cream/60">Dieses KI-Video hat kein Skript. Lege es aus einer Recherche oder dem Content-Plan an.</p>
      </Card>
    );
  }
  return (
    <>
      <details className="rounded-2xl border border-cream/[0.07] bg-ink-800 p-5">
        <summary className="cursor-pointer font-medium">
          1 · Skript: <span className="text-terracotta-light">{script.titel}</span>
        </summary>
        <div className="mt-5">
          <ScriptView script={script} />
        </div>
      </details>
      <VoicePanel project={project} enabled={Boolean(status?.elevenlabs)} />
      <ScenesPanel project={project} enabled={Boolean(status?.fal)} />
    </>
  );
}

function VoicePanel({ project, enabled }: { project: VideoProject; enabled: boolean }) {
  const job = useJob();
  const settings = settingsOf(project);
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [voiceId, setVoiceId] = useState(settings.voiceId ?? "");
  const vo = project.sources.find((s) => s.id === project.voiceover?.sourceId);
  const voUrl = useAssetUrl(vo?.assetId);

  useEffect(() => {
    if (!enabled) return;
    api<{ voices: Voice[]; defaultVoice: string | null }>("/api/studio/voice")
      .then((r) => {
        setVoices(r.voices);
        setVoiceId((current) => current || r.defaultVoice || r.voices[0]?.id || "");
      })
      .catch(() => setVoices([]));
  }, [enabled]);

  const selected = voices?.find((v) => v.id === voiceId);

  return (
    <Card>
      <h3 className="font-serif text-lg font-semibold">2 · Sprecherstimme</h3>
      <p className="text-sm text-cream/55">Das Voiceover bestimmt das Timing: Szenen, Schnitte und Untertitel richten sich nach der Stimme.</p>
      {!enabled ? (
        <div className="mt-4">
          <InfoNote>Für die Sprecherstimme wird ELEVENLABS_API_KEY benötigt.</InfoNote>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_200px_auto] md:items-end">
          <Field label="Stimme">
            {(id) => (
              <Select id={id} value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={!voices?.length}>
                {!voices && <option>Lade Stimmen …</option>}
                {voices?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.labels.gender ? ` · ${v.labels.gender}` : ""}
                    {v.labels.accent ? ` · ${v.labels.accent}` : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={`Tempo: ${settings.speed.toFixed(2)}×`}>
            {(id) => (
              <input
                id={id}
                type="range"
                min={0.8}
                max={1.2}
                step={0.05}
                value={settings.speed}
                onChange={(e) => void update("videos", project.id, (p) => ({ ...p, settings: { ...settingsOf(p), speed: Number(e.target.value) } }))}
                className="accent-terracotta"
              />
            )}
          </Field>
          <Btn
            icon={<Mic className="h-4 w-4" />}
            loading={job.busy}
            disabled={!voiceId}
            onClick={() => job.run("Voiceover", () => createVoiceover(project.id, voiceId))}
          >
            {vo ? "Neu einsprechen" : "Voiceover erzeugen"}
          </Btn>
        </div>
      )}
      {selected?.previewUrl && (
        <audio src={selected.previewUrl} controls className="mt-3 h-9 w-full max-w-sm" aria-label="Stimmprobe" />
      )}
      {job.error && (
        <div className="mt-4">
          <ErrorNote>{job.error}</ErrorNote>
        </div>
      )}
      {vo && voUrl && (
        <div className="mt-5 rounded-xl bg-ink-700 p-4">
          <p className="mb-2 text-sm font-medium">Voiceover · {vo.duration.toFixed(1)} s</p>
          <audio src={voUrl} controls className="h-9 w-full" />
        </div>
      )}
    </Card>
  );
}

function ScenesPanel({ project, enabled }: { project: VideoProject; enabled: boolean }) {
  const job = useJob();
  const settings = settingsOf(project);
  const script = project.script!;
  const [active, setActive] = useState<Set<number>>(new Set());
  const sceneSource = (i: number) => project.sources.find((s) => s.sceneIndex === i);
  const missing = script.szenen.map((_, i) => i).filter((i) => !sceneSource(i));

  const runScene = async (i: number, resume = false) => {
    setActive((s) => new Set(s).add(i));
    try {
      await (resume ? resumeScene(project.id, i) : generateScene(project.id, i));
    } finally {
      setActive((s) => {
        const next = new Set(s);
        next.delete(i);
        return next;
      });
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold">3 · Szenen</h3>
          <p className="text-sm text-cream/55">
            Jede Szene als KI-Clip generieren oder einen eigenen Clip einsetzen. Beides lässt sich mischen.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select
            value={settings.model}
            onChange={(e) => void update("videos", project.id, (p) => ({ ...p, settings: { ...settingsOf(p), model: e.target.value as VideoModelId } }))}
            className="w-auto"
            aria-label="KI-Modell"
          >
            {(Object.keys(VIDEO_MODELS) as VideoModelId[]).map((m) => (
              <option key={m} value={m}>
                {VIDEO_MODELS[m].label} – {VIDEO_MODELS[m].hint}
              </option>
            ))}
          </Select>
          <Btn
            icon={<Wand2 className="h-4 w-4" />}
            disabled={!enabled || !missing.length || job.busy}
            loading={job.busy}
            onClick={() =>
              job.run("Alle Szenen", async (ctx) => {
                let done = 0;
                ctx.note(`0/${missing.length} Szenen fertig`);
                const results = await mapLimit(missing, 3, async (i) => {
                  await runScene(i);
                  done++;
                  ctx.note(`${done}/${missing.length} Szenen fertig`);
                });
                const failed = results.filter((r) => r.status === "rejected").length;
                if (failed) throw new Error(`${failed} Szene(n) fehlgeschlagen – bitte einzeln erneut versuchen.`);
              })
            }
          >
            Alle fehlenden generieren ({missing.length})
          </Btn>
        </div>
      </div>
      {!enabled && (
        <div className="mt-4">
          <InfoNote>Für KI-Szenen wird FAL_KEY benötigt. Du kannst stattdessen für jede Szene einen eigenen Clip hochladen.</InfoNote>
        </div>
      )}
      {!project.voiceover && (
        <p className="mt-3 text-xs text-cream/45">Tipp: Erst das Voiceover erzeugen, dann passen die Clip-Längen genau zum Gesprochenen.</p>
      )}
      {job.busy && (
        <p className="mt-4 flex items-center gap-2 text-sm text-amber-100">
          <Spinner /> {job.note} · KI-Clips brauchen je 1–4 Minuten
        </p>
      )}
      {job.error && (
        <div className="mt-4">
          <ErrorNote>{job.error}</ErrorNote>
        </div>
      )}
      <ol className="mt-6 space-y-4">
        {script.szenen.map((scene, i) => (
          <SceneRow
            key={i}
            project={project}
            index={i}
            source={sceneSource(i)}
            busy={active.has(i)}
            enabled={enabled}
            onGenerate={(resume) => void runScene(i, resume).catch(() => {})}
          />
        ))}
      </ol>
    </Card>
  );
}

function SceneRow({
  project,
  index,
  source,
  busy,
  enabled,
  onGenerate,
}: {
  project: VideoProject;
  index: number;
  source: MediaSource | undefined;
  busy: boolean;
  enabled: boolean;
  onGenerate: (resume: boolean) => void;
}) {
  const scene = project.script!.szenen[index];
  const gen = project.generations?.find((g) => g.sceneIndex === index);
  const timing = project.sceneTimings?.find((t) => t.index === index);
  const url = useAssetUrl(source?.assetId);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const stuck = !busy && gen && (gen.status === "running" || gen.status === "queued");

  const setPrompt = (value: string) =>
    update("videos", project.id, (p) => {
      if (!p.script) return p;
      const szenen = p.script.szenen.map((s, j) => (j === index ? { ...s, kiPrompt: value } : s));
      return { ...p, script: { ...p.script, szenen } };
    });

  return (
    <li className="grid gap-4 rounded-2xl bg-ink-700 p-4 md:grid-cols-[120px_minmax(0,1fr)]">
      <div className="mx-auto aspect-[9/16] w-[120px] overflow-hidden rounded-xl bg-ink-600">
        {url ? (
          <video src={url} muted loop playsInline controls className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-cream/35">
            {busy || gen?.status === "running" || gen?.status === "queued" ? <Spinner /> : "noch kein Clip"}
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Szene {index + 1}</Badge>
          <span className="font-mono text-xs text-cream/50">
            {timing ? `${timing.start.toFixed(1)}–${timing.end.toFixed(1)} s` : `${scene.start}–${scene.ende} s`} · Clip {sceneSeconds(project, index)} s
          </span>
          {source && <Badge tone="success">{source.origin === "ai" ? "KI-Clip" : "Eigener Clip"}</Badge>}
          {gen?.status === "error" && <Badge tone="danger">Fehler</Badge>}
          {(busy || gen?.status === "running") && <Badge tone="warning">wird generiert</Badge>}
        </div>
        <p className="text-sm">
          <span className="text-cream/45">Bild:</span> {scene.bild}
        </p>
        {scene.gesprochen && (
          <p className="text-sm">
            <span className="text-cream/45">Text:</span> „{scene.gesprochen}“
          </p>
        )}
        <TextArea
          rows={2}
          defaultValue={scene.kiPrompt}
          key={scene.kiPrompt}
          onBlur={(e) => e.target.value !== scene.kiPrompt && void setPrompt(e.target.value)}
          aria-label={`KI-Prompt Szene ${index + 1}`}
          className="text-xs"
        />
        {gen?.status === "error" && gen.error && <p className="text-xs text-red-300">{gen.error}</p>}
        {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}
        <div className="flex flex-wrap gap-2">
          {stuck ? (
            <Btn size="sm" variant="secondary" icon={<RefreshCcw className="h-3.5 w-3.5" />} onClick={() => onGenerate(true)}>
              Status prüfen
            </Btn>
          ) : (
            <Btn size="sm" icon={<Wand2 className="h-3.5 w-3.5" />} disabled={!enabled || busy} onClick={() => onGenerate(false)}>
              {source ? "Neu generieren" : "KI-Clip generieren"}
            </Btn>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-ink-600 px-3 py-1.5 text-xs font-semibold hover:bg-ink-500">
            <Upload className="h-3.5 w-3.5" /> Eigenen Clip
            <input
              type="file"
              accept="video/*,image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploadError(null);
                try {
                  await addUploads(project.id, [file], index);
                } catch (error) {
                  setUploadError(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
                }
              }}
            />
          </label>
        </div>
      </div>
    </li>
  );
}
