"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { remove, removeAsset, update, useCollection, useRecord } from "@/lib/studio/db";
import { CAPTION_STYLE_LABEL, type CaptionStyleId, type Client, type VideoProject } from "@/lib/studio/types";
import { settingsOf } from "@/lib/studio/video/workflow";
import { ScriptView } from "../ScriptView";
import { Badge, Btn, Card, Empty, Field, Select, Toggle } from "../ui";
import { AiScenesPanel } from "./AiScenesPanel";
import { ClipFinderPanel } from "./ClipFinderPanel";
import { EditPanel } from "./EditPanel";
import { ExportPanel } from "./ExportPanel";
import { SourcesPanel } from "./SourcesPanel";

export function VideoStudio({ id }: { id: string }) {
  const project = useRecord("videos", id);
  const client = useRecord("clients", project?.clientId);
  if (project === undefined) return null;
  if (project === null) return <Empty title="Videoprojekt nicht gefunden" />;
  if (!client) return null;
  return <Studio project={project} client={client} />;
}

const STATUS: VideoProject["status"][] = ["entwurf", "geschnitten", "fertig", "gepostet"];

function Studio({ project, client }: { project: VideoProject; client: Client }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const allVideos = useCollection("videos");

  // Immer über update() schreiben: parallel laufende Jobs (KI-Szenen,
  // Rendern) ändern dasselbe Projekt und dürfen nicht überschrieben werden.
  const save = (fn: (p: VideoProject) => VideoProject) => update("videos", project.id, fn);

  const deleteProject = async () => {
    if (!window.confirm("Dieses Videoprojekt mit allen Dateien löschen?")) return;
    // Dateien nur löschen, wenn kein anderes Projekt sie nutzt (Clip-Finder teilt Rohmaterial).
    const usedElsewhere = new Set(
      (allVideos ?? []).filter((v) => v.id !== project.id).flatMap((v) => [...v.sources.map((s) => s.assetId), ...v.renders.map((r) => r.assetId)]),
    );
    for (const assetId of [...project.sources.map((s) => s.assetId), ...project.renders.map((r) => r.assetId)]) {
      if (!usedElsewhere.has(assetId)) await removeAsset(assetId);
    }
    await remove("videos", project.id);
    router.push(`/studio/kunde/${client.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href={`/studio/kunde/${client.id}`} className="inline-flex items-center gap-1.5 text-sm text-cream/55 hover:text-cream">
        <ArrowLeft className="h-4 w-4" /> {client.name}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== project.title && save((p) => ({ ...p, title: title.trim() }))}
          className="min-w-0 flex-1 rounded-lg bg-transparent font-serif text-2xl font-semibold outline-none focus:bg-ink-800 sm:text-3xl"
          aria-label="Titel"
        />
        <Badge tone="accent">{project.mode === "ai" ? "KI-Video" : "Eigene Clips"}</Badge>
        <Select
          value={project.status}
          onChange={(e) => save((p) => ({ ...p, status: e.target.value as VideoProject["status"] }))}
          className="w-auto py-1.5"
          aria-label="Status"
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Btn variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={deleteProject}>
          Löschen
        </Btn>
      </div>

      {project.mode === "upload" ? (
        <>
          {project.script && (
            <details className="rounded-2xl border border-cream/[0.07] bg-ink-800 p-5">
              <summary className="cursor-pointer font-medium">
                Drehvorlage: <span className="text-terracotta-light">{project.script.titel}</span>{" "}
                <span className="text-sm text-cream/45">(Skript, Hooks, Teleprompter)</span>
              </summary>
              <div className="mt-5">
                <ScriptView script={project.script} label="Drehvorlage" />
              </div>
            </details>
          )}
          <SourcesPanel project={project} />
          <ClipFinderPanel project={project} client={client} />
          <LookPanel project={project} client={client} />
          <EditPanel project={project} client={client} />
        </>
      ) : (
        <>
          <AiScenesPanel project={project} />
          <LookPanel project={project} client={client} />
        </>
      )}

      <ExportPanel project={project} client={client} />
    </div>
  );
}

function LookPanel({ project, client }: { project: VideoProject; client: Client }) {
  const settings = settingsOf(project);
  const set = (patch: Partial<typeof settings>) =>
    update("videos", project.id, (p) => ({ ...p, settings: { ...settingsOf(p), ...patch } }));
  return (
    <Card>
      <h3 className="mb-4 font-serif text-lg font-semibold">Look</h3>
      <div className="grid gap-5 md:grid-cols-[1fr_auto_auto] md:items-end">
        <Field label="Untertitel-Stil">
          {(id) => (
            <Select
              id={id}
              value={project.captionStyle ?? client.brand.captionStyle}
              onChange={(e) => update("videos", project.id, (p) => ({ ...p, captionStyle: e.target.value as CaptionStyleId }))}
            >
              {Object.entries(CAPTION_STYLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Toggle checked={settings.captions} onChange={(v) => set({ captions: v })} label="Untertitel" hint="Wort für Wort animiert" />
        <Toggle checked={settings.progressBar} onChange={(v) => set({ progressBar: v })} label="Fortschrittsbalken" hint="Hält Zuschauer länger" />
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-cream/45">
        Markenfarben:
        <span className="h-4 w-4 rounded" style={{ background: client.brand.primary }} />
        <span className="h-4 w-4 rounded border border-cream/20" style={{ background: client.brand.accent }} />
        {client.brand.watermark && client.brand.logo ? "· Logo-Wasserzeichen aktiv" : ""} · änderbar im Brand-Kit des Kunden
      </p>
    </Card>
  );
}
