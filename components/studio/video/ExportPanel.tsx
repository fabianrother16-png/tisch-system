"use client";

import { Download, Eye, Film, RefreshCcw, Sparkles, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { update, useAssetUrl } from "@/lib/studio/db";
import { fmtDateTime, fmtSec, slugify } from "@/lib/studio/format";
import type { Client, RenderedVideo, VideoProject } from "@/lib/studio/types";
import { buildTimeline, improvementBrief, planEdit, rateRender, renderProject, settingsOf } from "@/lib/studio/video/workflow";
import { useStudioStatus } from "../StudioShell";
import { Badge, Btn, Card, ErrorNote, Progress, cx } from "../ui";
import { RatingCard } from "./RatingCard";
import { useJob } from "./useJob";

function canBuild(project: VideoProject, client: Client) {
  try {
    const tl = buildTimeline(project, client);
    if (tl.duration < 1) return "Die Timeline ist noch leer.";
    if (project.mode === "ai" && !tl.video.length) return "Noch keine Szenen-Clips vorhanden.";
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Noch nicht bereit.";
  }
}

export function ExportPanel({ project, client }: { project: VideoProject; client: Client }) {
  const job = useJob();
  const { status } = useStudioStatus();
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(project.renders[project.renders.length - 1]?.assetId ?? null);
  const blocker = canBuild(project, client);
  const renders = project.renders;
  const current = renders.find((r) => r.assetId === selected) ?? renders[renders.length - 1];

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const renderFinal = (ctx: Parameters<Parameters<typeof job.run>[1]>[0]) =>
    renderProject(project.id, client, "final", (p, stage) => {
      ctx.progress(p);
      ctx.note(stage);
    }, ctx.signal);

  const doPreview = () =>
    job.run("Vorschau", async (ctx) => {
      const result = await renderProject(project.id, client, "preview", (p, stage) => {
        ctx.progress(p);
        ctx.note(`Vorschau: ${stage}`);
      }, ctx.signal);
      setPreview(URL.createObjectURL(result.blob));
    });

  const doFinal = () =>
    job.run("Export", async (ctx) => {
      const result = await renderFinal(ctx);
      if (result.assetId) setSelected(result.assetId);
      setPreview(null);
      if (status?.claude && result.assetId) {
        ctx.note("Viral-Check läuft …");
        ctx.progress(1);
        await rateRender(project.id, client, result.assetId);
      }
    });

  const doRate = (assetId: string) =>
    job.run("Viral-Check", async (ctx) => {
      ctx.note("Viral-Check läuft …");
      await rateRender(project.id, client, assetId);
    });

  // Die Verbesserungsschleife: Rating → neuer Schnitt → Rendern → neues Rating.
  const doImprove = (assetId: string) =>
    job.run("Verbessern", async (ctx) => {
      const brief = improvementBrief(project, assetId);
      await update("videos", project.id, (p) => ({ ...p, settings: { ...settingsOf(p), wunsch: brief } }));
      ctx.note("KI schneidet mit den Verbesserungen neu …");
      await planEdit(project.id, client, ctx.note);
      const result = await renderFinal(ctx);
      if (result.assetId) {
        setSelected(result.assetId);
        ctx.note("Viral-Check der neuen Version …");
        await rateRender(project.id, client, result.assetId);
      }
    });

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold">{project.mode === "ai" ? "5" : "3"} · Rendern, Viral-Check & Export</h3>
          <p className="text-sm text-cream/55">
            Wird direkt in deinem Browser gerendert: 1080×1920, 30 fps, MP4. Danach bewertet die KI das fertige Video und schreibt Caption
            und Hashtags.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={doPreview} disabled={Boolean(blocker) || job.busy}>
            Schnelle Vorschau
          </Btn>
          <Btn icon={<Film className="h-4 w-4" />} onClick={doFinal} disabled={Boolean(blocker) || job.busy}>
            Final rendern
          </Btn>
        </div>
      </div>
      {blocker && <p className="mt-3 text-sm text-cream/45">{blocker}</p>}

      {job.busy && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-100">{job.note ?? job.label}</span>
            <button onClick={job.cancel} className="inline-flex items-center gap-1 text-cream/50 hover:text-cream">
              <X className="h-3.5 w-3.5" /> Abbrechen
            </button>
          </div>
          <Progress value={job.progress ?? 0} />
          <p className="text-xs text-cream/40">Tab bitte offen lassen – das Video entsteht auf deinem Rechner.</p>
        </div>
      )}
      {job.error && (
        <div className="mt-4">
          <ErrorNote>{job.error}</ErrorNote>
        </div>
      )}

      {preview && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Vorschau (halbe Auflösung)</p>
          <PhoneFrame>
            <video src={preview} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />
          </PhoneFrame>
        </div>
      )}

      {renders.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/45">Versionen</p>
          <div className="flex flex-wrap gap-2">
            {renders.map((r, i) => (
              <button
                key={r.assetId}
                onClick={() => setSelected(r.assetId)}
                className={cx(
                  "rounded-xl border px-3 py-2 text-left text-sm",
                  current?.assetId === r.assetId ? "border-terracotta bg-terracotta/10" : "border-cream/10 hover:border-cream/25",
                )}
              >
                <span className="font-semibold">V{i + 1}</span>{" "}
                {r.rating ? (
                  <Badge tone={r.rating.gesamt >= 70 ? "success" : r.rating.gesamt >= 50 ? "warning" : "danger"}>{Math.round(r.rating.gesamt)}</Badge>
                ) : (
                  <Badge>ohne Rating</Badge>
                )}
                <span className="block text-xs text-cream/40">{fmtDateTime(r.createdAt)}</span>
              </button>
            ))}
          </div>
          {current && (
            <RenderDetail
              key={current.assetId}
              render={current}
              index={renders.indexOf(current)}
              project={project}
              busy={job.busy}
              onRate={() => doRate(current.assetId)}
              onImprove={project.mode === "upload" ? () => doImprove(current.assetId) : undefined}
            />
          )}
        </div>
      )}
    </Card>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[28px] border-[6px] border-ink-600 bg-black shadow-2xl">
      {children}
    </div>
  );
}

function RenderDetail({
  render,
  index,
  project,
  busy,
  onRate,
  onImprove,
}: {
  render: RenderedVideo;
  index: number;
  project: VideoProject;
  busy: boolean;
  onRate: () => void;
  onImprove?: () => void;
}) {
  const url = useAssetUrl(render.assetId);
  const ext = render.mime.includes("webm") ? "webm" : "mp4";
  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-3">
        <PhoneFrame>
          {/* #t=0.1 zeigt statt Schwarz direkt das erste Bild als Vorschau. */}
          {url && <video src={`${url}#t=0.1`} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />}
        </PhoneFrame>
        <div className="flex flex-wrap justify-center gap-2">
          {url && (
            <a
              href={url}
              download={`${slugify(project.title)}-v${index + 1}.${ext}`}
              className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold hover:bg-terracotta-light"
            >
              <Download className="h-4 w-4" /> Herunterladen
            </a>
          )}
        </div>
        <p className="text-center text-xs text-cream/40">
          {fmtSec(render.duration)} · {ext.toUpperCase()}
          {ext === "webm" ? " – dein Browser kann kein H.264, für Instagram besser Chrome/Safari nutzen" : ""}
        </p>
        <p className="text-center text-xs text-cream/40">Tipp: Trend-Sound beim Hochladen in der App leise (5–10 %) darunterlegen.</p>
      </div>
      <div>
        {render.rating ? (
          <RatingCard
            rating={render.rating}
            action={
              <>
                {onImprove && (
                  <Btn icon={<Wand2 className="h-4 w-4" />} onClick={onImprove} disabled={busy}>
                    Verbesserungen umsetzen & neu schneiden
                  </Btn>
                )}
                <Btn variant="secondary" icon={<RefreshCcw className="h-4 w-4" />} onClick={onRate} disabled={busy}>
                  Erneut bewerten
                </Btn>
              </>
            }
          />
        ) : (
          <Card className="flex flex-col items-start gap-3">
            <p className="text-sm text-cream/65">Für diese Version gibt es noch keinen Viral-Check.</p>
            <Btn icon={<Sparkles className="h-4 w-4" />} onClick={onRate} disabled={busy}>
              Viral-Check starten
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}
