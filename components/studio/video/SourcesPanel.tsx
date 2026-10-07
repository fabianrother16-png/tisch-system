"use client";

import { AudioLines, Captions, Film, ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { getAsset } from "@/lib/studio/db";
import { fmtSec } from "@/lib/studio/format";
import type { MediaSource, VideoProject } from "@/lib/studio/types";
import { extractFrames } from "@/lib/studio/video/media";
import { addUploads, removeSource, transcribeMissing } from "@/lib/studio/video/workflow";
import { useStudioStatus } from "../StudioShell";
import { Badge, Btn, Card, ErrorNote, InfoNote, Spinner, cx } from "../ui";
import { useJob } from "./useJob";

const thumbCache = new Map<string, string>();

export function useThumb(source: MediaSource | undefined) {
  const [loaded, setLoaded] = useState<{ assetId: string; url: string } | null>(null);
  const assetId = source?.assetId;
  const kind = source?.kind;
  const duration = source?.duration ?? 0;
  useEffect(() => {
    if (!assetId || kind === "audio" || thumbCache.has(assetId)) return;
    let alive = true;
    void (async () => {
      const asset = await getAsset(assetId);
      if (!asset) return;
      const [frame] = await extractFrames(asset.blob, [Math.min(0.6, duration / 2)], 320, 0.7).catch(() => []);
      if (!frame) return;
      thumbCache.set(assetId, frame.dataUrl);
      if (alive) setLoaded({ assetId, url: frame.dataUrl });
    })();
    return () => {
      alive = false;
    };
  }, [assetId, kind, duration]);
  if (!assetId) return null;
  return thumbCache.get(assetId) ?? (loaded?.assetId === assetId ? loaded.url : null);
}

function SourceRow({ source, onRemove }: { source: MediaSource; onRemove: () => void }) {
  const thumb = useThumb(source);
  const words = source.transcript;
  return (
    <li className="flex items-center gap-4 rounded-xl bg-ink-700 p-3">
      <div className="flex h-20 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-600">
        {thumb ? (
          // Lokal erzeugtes Standbild (Data-URL).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : source.kind === "audio" ? (
          <AudioLines className="h-5 w-5 text-cream/40" />
        ) : source.kind === "image" ? (
          <ImageIcon className="h-5 w-5 text-cream/40" />
        ) : (
          <Film className="h-5 w-5 text-cream/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Badge tone="accent">{source.id}</Badge>
          <span className="truncate">{source.name}</span>
        </p>
        <p className="mt-1 text-xs text-cream/50">
          {fmtSec(source.duration)}
          {source.width ? ` · ${source.width}×${source.height}` : ""}
        </p>
        <p className="mt-1 truncate text-xs text-cream/45">
          {words === undefined ? (
            <span className="inline-flex items-center gap-1 text-amber-200/80">
              <Captions className="h-3 w-3" /> Untertitel ausstehend
            </span>
          ) : words.length ? (
            <>„{words.slice(0, 14).map((w) => w.text).join(" ")} …“</>
          ) : (
            "kein gesprochener Text"
          )}
        </p>
      </div>
      <button onClick={onRemove} className="rounded-lg p-2 text-cream/40 hover:bg-ink-600 hover:text-red-300" aria-label={`${source.id} entfernen`}>
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function SourcesPanel({ project }: { project: VideoProject }) {
  const job = useJob();
  const { status } = useStudioStatus();
  const [drag, setDrag] = useState(false);
  const sources = project.sources.filter((s) => s.sceneIndex == null && s.id !== "VO");
  const pending = sources.some((s) => s.transcript === undefined);

  const ingest = (files: File[]) =>
    job.run("Dateien einlesen", async (ctx) => {
      const media = files.filter((f) => /^(video|audio|image)\//.test(f.type) || /\.(mov|mp4|m4v|webm|mkv)$/i.test(f.name));
      if (!media.length) throw new Error("Bitte Video-, Audio- oder Bilddateien wählen.");
      ctx.note(`${media.length} Datei(en) werden eingelesen …`);
      await addUploads(project.id, media);
      if (status?.elevenlabs) {
        ctx.note("Gesprochenes wird erkannt (für Untertitel und Schnitt) …");
        await transcribeMissing(project.id, ctx.note);
      }
    });

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold">1 · Rohmaterial</h3>
          <p className="text-sm text-cream/55">Alle Clips zu diesem Video hochladen. Die Dateien bleiben auf deinem Rechner.</p>
        </div>
        {pending && !job.busy && status?.elevenlabs && (
          <Btn size="sm" variant="secondary" onClick={() => job.run("Untertitel erkennen", (ctx) => transcribeMissing(project.id, ctx.note))}>
            Untertitel erkennen
          </Btn>
        )}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void ingest([...e.dataTransfer.files]);
        }}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          drag ? "border-terracotta bg-terracotta/10" : "border-cream/15 hover:border-cream/30",
        )}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-terracotta-light" />
        <span className="font-medium">Clips hierher ziehen oder auswählen</span>
        <span className="mt-1 text-xs text-cream/45">MP4, MOV, WebM · Handy-Aufnahmen hoch- oder querformatig · auch Fotos und Audio</span>
        <input
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          className="sr-only"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            void ingest(files);
          }}
        />
      </label>

      {job.busy && (
        <p className="mt-4 flex items-center gap-2 text-sm text-amber-100">
          <Spinner /> {job.note ?? job.label}
        </p>
      )}
      {job.error && (
        <div className="mt-4">
          <ErrorNote>{job.error}</ErrorNote>
        </div>
      )}
      {!status?.elevenlabs && sources.length > 0 && (
        <div className="mt-4">
          <InfoNote>
            Ohne ELEVENLABS_API_KEY kann das Studio nicht hören, was gesagt wird: keine automatischen Untertitel, und die KI schneidet nur nach
            Bild.
          </InfoNote>
        </div>
      )}

      {sources.length > 0 && (
        <ul className="mt-5 space-y-2">
          {sources.map((s) => (
            <SourceRow key={s.id} source={s} onRemove={() => void removeSource(project.id, s.id)} />
          ))}
        </ul>
      )}
    </Card>
  );
}
