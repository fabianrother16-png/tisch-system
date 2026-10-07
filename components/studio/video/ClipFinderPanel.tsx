"use client";

import { Layers, Rocket, Scissors } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { runAi } from "@/lib/studio/api";
import { put, uid, update, useCollection } from "@/lib/studio/db";
import { fmtSec } from "@/lib/studio/format";
import { toBrief } from "@/lib/studio/tasks";
import { DEFAULT_VIDEO_SETTINGS, type Client, type VideoProject } from "@/lib/studio/types";
import { rateRender, renderProject } from "@/lib/studio/video/workflow";
import { useStudioStatus } from "../StudioShell";
import { Badge, Btn, Card, ErrorNote, Field, Progress, Select, Spinner } from "../ui";
import { useJob } from "./useJob";

type Clip = NonNullable<VideoProject["clipIdeas"]>[number];

/** Legt aus einem gefundenen Moment ein eigenes Short-Projekt an. */
async function createShort(project: VideoProject, sourceId: string, clip: Clip) {
  const src = project.sources.find((s) => s.id === sourceId)!;
  const now = Date.now();
  const short: VideoProject = {
    id: uid("v_"),
    clientId: project.clientId,
    createdAt: now,
    updatedAt: now,
    title: clip.titel,
    mode: "upload",
    parentId: project.id,
    script: project.script,
    sources: [{ ...src, id: "C1" }],
    renders: [],
    captionStyle: project.captionStyle,
    status: "geschnitten",
    settings: {
      ...DEFAULT_VIDEO_SETTINGS,
      ...(project.settings ?? {}),
      zielLaenge: Math.max(10, Math.min(90, Math.round(clip.ende - clip.start))),
      wunsch: `Verwende nur den Bereich ${clip.start.toFixed(1)}–${clip.ende.toFixed(1)} s aus C1. Thema: ${clip.titel}.`,
    },
    editPlan: {
      konzept: clip.warum,
      hookText: clip.hookText,
      segmente: [{ quelle: "C1", start: clip.start, ende: clip.ende, zweck: "inhalt", zoom: "leicht", textEinblendung: "" }],
      untertitel: true,
      zielLaengeSekunden: clip.ende - clip.start,
      begruendung: [clip.warum],
    },
  };
  await put("videos", short);
  return short;
}

export function ClipFinderPanel({ project, client }: { project: VideoProject; client: Client }) {
  const { status } = useStudioStatus();
  const job = useJob();
  const children = useCollection("videos", client.id)?.filter((v) => v.parentId === project.id) ?? [];
  const longSources = project.sources.filter((s) => s.kind !== "image" && s.duration >= 60 && s.transcript?.length);
  const [picked, setSourceId] = useState(project.clipSource ?? "");
  const [count, setCount] = useState(4);
  if (!longSources.length) return null;
  // Auswahl erst gültig, wenn die Quelle transkribiert ist – sonst die erste passende.
  const sourceId = longSources.some((s) => s.id === picked) ? picked : longSources[0].id;
  const clips = project.clipIdeas ?? [];

  const find = () =>
    job.run("Clip-Finder", async (ctx) => {
      const src = project.sources.find((s) => s.id === sourceId);
      if (!src?.transcript?.length) throw new Error("Für diese Quelle gibt es noch kein Transkript.");
      ctx.note("KI sucht die stärksten Momente …");
      const result = await runAi("clipFinder", {
        client: toBrief(client),
        dauer: src.duration,
        anzahl: count,
        woerter: src.transcript.slice(0, 20000),
      });
      const valid = result.clips
        .map((c) => ({ ...c, start: Math.max(0, c.start), ende: Math.min(src.duration, c.ende) }))
        .filter((c) => c.ende - c.start >= 5)
        .sort((a, b) => b.score - a.score);
      await update("videos", project.id, (p) => ({ ...p, clipIdeas: valid, clipSource: sourceId }));
    });

  // Serienproduktion: alle Momente als Shorts anlegen, rendern und bewerten.
  const produceAll = () =>
    job.run("Serienproduktion", async (ctx) => {
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        ctx.note(`Short ${i + 1}/${clips.length}: „${clip.titel}“ wird gerendert …`);
        const short = await createShort(project, project.clipSource ?? sourceId, clip);
        const result = await renderProject(short.id, client, "final", (p) => ctx.progress((i + p) / clips.length), ctx.signal);
        if (status?.claude && result.assetId) {
          ctx.note(`Short ${i + 1}/${clips.length}: Viral-Check …`);
          await rateRender(short.id, client, result.assetId);
        }
      }
    });

  return (
    <Card className="border-terracotta/25">
      <div className="flex items-start gap-3">
        <Layers className="mt-1 h-5 w-5 shrink-0 text-terracotta-light" />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold">Clip-Finder: aus einem langen Video viele Shorts</h3>
          <p className="text-sm text-cream/55">
            Die KI findet die stärksten, eigenständigen Momente (z. B. aus Interview, Vortrag oder Baustellen-Doku) und macht daraus
            einzelne Shorts mit eigenem Hook.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <Field label="Lange Aufnahme">
          {(id) => (
            <Select id={id} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {longSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name} ({fmtSec(s.duration)})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={`Anzahl Shorts: ${count}`}>
          {(id) => (
            <input id={id} type="range" min={2} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} className="accent-terracotta" />
          )}
        </Field>
        <Btn icon={<Scissors className="h-4 w-4" />} onClick={find} disabled={job.busy || !status?.claude}>
          Momente finden
        </Btn>
      </div>
      {job.busy && (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-2 text-sm text-amber-100">
            <Spinner /> {job.note}
          </p>
          {job.label === "Serienproduktion" && <Progress value={job.progress ?? 0} />}
        </div>
      )}
      {job.error && (
        <div className="mt-4">
          <ErrorNote>{job.error}</ErrorNote>
        </div>
      )}
      {clips.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{clips.length} Momente gefunden</p>
            <Btn icon={<Rocket className="h-4 w-4" />} onClick={produceAll} disabled={job.busy}>
              Alle als Shorts produzieren
            </Btn>
          </div>
          {clips.map((clip, i) => (
            <ClipRow key={`${clip.start}-${i}`} clip={clip} onCreate={() => createShort(project, project.clipSource ?? sourceId, clip)} />
          ))}
        </div>
      )}
      {children.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/45">Daraus entstanden</p>
          <div className="flex flex-wrap gap-2">
            {children.map((c) => {
              const r = c.renders[c.renders.length - 1];
              return (
                <Link key={c.id} href={`/studio/video/${c.id}`} className="rounded-xl bg-ink-700 px-3 py-2 text-sm hover:bg-ink-600">
                  {c.title} {r?.rating && <Badge tone={r.rating.gesamt >= 70 ? "success" : "warning"}>{Math.round(r.rating.gesamt)}</Badge>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function ClipRow({ clip, onCreate }: { clip: Clip; onCreate: () => Promise<VideoProject> }) {
  const [created, setCreated] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-start gap-4 rounded-xl bg-ink-700 p-4">
      <Badge tone={clip.score >= 70 ? "success" : clip.score >= 50 ? "warning" : "neutral"}>{Math.round(clip.score)}</Badge>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{clip.titel}</p>
        <p className="text-xs text-cream/50">
          {clip.start.toFixed(1)}–{clip.ende.toFixed(1)} s · {fmtSec(clip.ende - clip.start)} · Hook: „{clip.hookText}“
        </p>
        <p className="mt-1 text-sm text-cream/70">{clip.warum}</p>
      </div>
      {created ? (
        <Link href={`/studio/video/${created}`} className="rounded-xl bg-ink-600 px-3 py-1.5 text-xs font-semibold hover:bg-ink-500">
          Öffnen →
        </Link>
      ) : (
        <Btn size="sm" variant="secondary" onClick={async () => setCreated((await onCreate()).id)}>
          Als Short anlegen
        </Btn>
      )}
    </div>
  );
}
