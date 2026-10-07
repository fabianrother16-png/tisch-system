"use client";

// Arbeitsschritte eines Videoprojekts (alles im Browser, Ergebnisse in
// IndexedDB): Upload, Transkription, KI-Schnittplan, Voiceover,
// KI-Szenen, Rendern, Viral-Rating.

import { api, ApiError, mapLimit, runAi, sleep } from "../api";
import { getAsset, getOne, saveAsset, update } from "../db";
import { toBrief } from "../tasks";
import {
  DEFAULT_VIDEO_SETTINGS,
  type Client,
  type MediaSource,
  type TranscriptWord,
  type VideoProject,
  type VideoSettings,
} from "../types";
import { VIDEO_MODELS } from "../videoModels";
import { extractFrames, extractSpeechAudio, probeMedia, spreadTimes } from "./media";
import { renderTimeline, type RenderResult } from "./render";
import { sceneTimingsFromVoiceover, timelineFromEditPlan, timelineFromScript, type Timeline } from "./timeline";

export function settingsOf(project: VideoProject): VideoSettings {
  return { ...DEFAULT_VIDEO_SETTINGS, ...(project.settings ?? {}) };
}

async function patch(id: string, fn: (p: VideoProject) => Partial<VideoProject>) {
  return update("videos", id, (p) => ({ ...p, ...fn(p) }));
}

async function loadVideo(id: string) {
  const project = await getOne("videos", id);
  if (!project) throw new Error("Videoprojekt nicht gefunden.");
  return project;
}

export async function blobFor(project: VideoProject, sourceId: string) {
  const source = project.sources.find((s) => s.id === sourceId);
  if (!source) throw new Error(`Quelle ${sourceId} fehlt.`);
  const asset = await getAsset(source.assetId);
  if (!asset) throw new Error(`Datei für ${sourceId} wurde nicht gefunden (evtl. auf einem anderen Gerät erstellt).`);
  return asset.blob;
}

function nextSourceId(sources: MediaSource[], prefix: string) {
  let n = 1;
  const ids = new Set(sources.map((s) => s.id));
  while (ids.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

// ---------------------------------------------------------------------------
// Upload & Transkription
// ---------------------------------------------------------------------------

export async function addUploads(projectId: string, files: File[], sceneIndex?: number) {
  const added: MediaSource[] = [];
  for (const file of files) {
    const info = await probeMedia(file);
    const asset = await saveAsset(file, file.name);
    await update("videos", projectId, (p) => {
      const source: MediaSource = {
        // Szenen-Clips heißen fest S1, S2 … (wie die KI-Clips derselben Szene).
        id: sceneIndex != null ? `S${sceneIndex + 1}` : nextSourceId(p.sources, "C"),
        assetId: asset.id,
        kind: info.kind,
        name: file.name,
        duration: info.duration,
        width: info.width,
        height: info.height,
        origin: "upload",
        sceneIndex,
        // Bilder, Clips ohne Ton und Szenen-Clips (Ton kommt vom Voiceover)
        // brauchen keine Transkription.
        transcript: info.hasAudio && sceneIndex == null ? undefined : [],
      };
      added.push(source);
      // Pro Szene nur ein Clip: alten ersetzen.
      const sources = sceneIndex != null ? p.sources.filter((s) => s.sceneIndex !== sceneIndex) : p.sources;
      return { ...p, sources: [...sources, source] };
    });
  }
  return added;
}

export async function removeSource(projectId: string, sourceId: string) {
  await patch(projectId, (p) => ({ sources: p.sources.filter((s) => s.id !== sourceId), editPlan: undefined }));
}

export async function transcribeBlob(blob: Blob, duration: number, onProgress?: (p: number) => void): Promise<TranscriptWord[]> {
  const chunks = await extractSpeechAudio(blob, duration);
  const words: TranscriptWord[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const form = new FormData();
    form.append("file", chunks[i].blob, chunks[i].blob.type === "audio/wav" ? "audio.wav" : "audio.ogg");
    form.append("language", "de");
    const result = await api<{ words: TranscriptWord[] }>("/api/studio/transcribe", { method: "POST", body: form });
    words.push(...result.words.map((w) => ({ ...w, start: w.start + chunks[i].start, end: w.end + chunks[i].start })));
    onProgress?.((i + 1) / chunks.length);
  }
  return words;
}

/** Transkribiert alle Quellen mit Ton, die noch kein Transkript haben. */
export async function transcribeMissing(projectId: string, onNote?: (text: string) => void) {
  const project = await loadVideo(projectId);
  const todo = project.sources.filter((s) => s.kind !== "image" && s.transcript === undefined);
  let done = 0;
  const results = await mapLimit(todo, 2, async (source) => {
    const blob = await blobFor(project, source.id);
    const words = await transcribeBlob(blob, source.duration);
    await update("videos", projectId, (p) => ({
      ...p,
      sources: p.sources.map((s) => (s.id === source.id ? { ...s, transcript: words } : s)),
    }));
    done++;
    onNote?.(`Untertitel erkannt: ${done}/${todo.length}`);
  });
  const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
  if (failed) throw failed.reason;
}

// ---------------------------------------------------------------------------
// Schnittplan (eigene Clips)
// ---------------------------------------------------------------------------

async function sourceFrames(project: VideoProject, maxTotal = 14) {
  const visual = project.sources.filter((s) => s.kind !== "audio");
  if (!visual.length) return [];
  const per = Math.max(1, Math.floor(maxTotal / visual.length));
  const frames: { t: number; source: string; dataUrl: string }[] = [];
  for (const s of visual) {
    const blob = await blobFor(project, s.id);
    const count = Math.min(per, Math.max(1, Math.round(s.duration / 4)));
    const shots = await extractFrames(blob, spreadTimes(s.duration, count), 448, 0.68);
    frames.push(...shots.map((f) => ({ ...f, source: s.id })));
  }
  return frames.slice(0, maxTotal);
}

export async function planEdit(projectId: string, client: Client, onNote?: (t: string) => void) {
  const project = await loadVideo(projectId);
  const settings = settingsOf(project);
  if (!project.sources.length) throw new Error("Bitte zuerst Clips hochladen.");
  onNote?.("Standbilder für die KI vorbereiten …");
  const frames = await sourceFrames(project);
  onNote?.("KI schneidet …");
  const plan = await runAi("editPlan", {
    client: toBrief(client),
    skript: project.script ?? null,
    wunsch: settings.wunsch,
    zielLaenge: settings.zielLaenge,
    quellen: project.sources.map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      kind: s.kind,
      words: (s.transcript ?? []).slice(0, 8000),
    })),
    frames,
  });
  const ids = new Set(project.sources.map((s) => s.id.toUpperCase()));
  const segmente = plan.segmente.filter((seg) => ids.has(seg.quelle.trim().toUpperCase()) && seg.ende - seg.start >= 0.25);
  if (!segmente.length) throw new Error("Die KI hat keinen verwertbaren Schnitt geliefert. Bitte erneut versuchen.");
  await patch(projectId, () => ({ editPlan: { ...plan, segmente }, status: "geschnitten" }));
}

// ---------------------------------------------------------------------------
// KI-Video: Voiceover + Szenen
// ---------------------------------------------------------------------------

/** Sprechtext des Skripts: Hook + Szenen, mit Zeichen-Offsets pro Szene. */
export function voiceoverText(project: VideoProject) {
  const script = project.script!;
  const parts: string[] = [];
  const sceneCharStarts: number[] = [];
  let length = 0;
  const hook = script.hooks[0]?.text?.trim() ?? "";
  const firstSpoken = script.szenen[0]?.gesprochen?.trim() ?? "";
  // Den Hook nur voranstellen, wenn Szene 1 ihn nicht ohnehin spricht.
  const prefixHook = hook && !normalize(firstSpoken).startsWith(normalize(hook).slice(0, 25));
  if (prefixHook) {
    parts.push(hook);
    length += hook.length + 1;
  }
  script.szenen.forEach((scene, i) => {
    const text = scene.gesprochen.trim();
    if (!text) {
      sceneCharStarts.push(-1);
      return;
    }
    sceneCharStarts.push(i === 0 && prefixHook ? 0 : length);
    parts.push(text);
    length += text.length + 1;
  });
  return { text: parts.join(" "), sceneCharStarts };
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function base64ToBlob(b64: string, type: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function createVoiceover(projectId: string, voiceId: string) {
  const project = await loadVideo(projectId);
  if (!project.script) throw new Error("Kein Skript vorhanden.");
  const settings = settingsOf(project);
  const { text, sceneCharStarts } = voiceoverText(project);
  const result = await api<{ audioBase64: string; words: TranscriptWord[]; charStarts: number[] }>("/api/studio/voice", {
    method: "POST",
    body: JSON.stringify({ text, voiceId, speed: settings.speed }),
  });
  const blob = base64ToBlob(result.audioBase64, "audio/mpeg");
  const info = await probeMedia(blob);
  const asset = await saveAsset(blob, "voiceover.mp3");
  const timings = sceneTimingsFromVoiceover(project.script, sceneCharStarts, result.charStarts, info.duration);
  await patch(projectId, (p) => {
    const source: MediaSource = {
      id: "VO",
      assetId: asset.id,
      kind: "audio",
      name: "Voiceover",
      duration: info.duration,
      origin: "tts",
      transcript: result.words,
    };
    return {
      sources: [...p.sources.filter((s) => s.id !== "VO"), source],
      voiceover: { sourceId: "VO", voiceId, words: result.words },
      sceneTimings: timings,
      settings: { ...settingsOf(p), voiceId },
    };
  });
}

/** Dauer, die ein KI-Clip für eine Szene haben sollte. */
export function sceneSeconds(project: VideoProject, index: number) {
  const timing = project.sceneTimings?.find((t) => t.index === index);
  const scene = project.script?.szenen[index];
  const dur = timing ? timing.end - timing.start : scene ? scene.ende - scene.start : 5;
  const model = VIDEO_MODELS[settingsOf(project).model];
  return Math.min(model.maxSec, Math.max(model.minSec, Math.ceil(dur)));
}

function genSetter(projectId: string, index: number) {
  return (state: Partial<NonNullable<VideoProject["generations"]>[number]>) =>
    patch(projectId, (p) => {
      const gens = [...(p.generations ?? [])];
      const i = gens.findIndex((g) => g.sceneIndex === index);
      const base = i >= 0 ? gens[i] : { sceneIndex: index, status: "queued" as const, model: settingsOf(p).model, prompt: "" };
      const nextGen = { ...base, ...state };
      if (i >= 0) gens[i] = nextGen;
      else gens.push(nextGen);
      return { generations: gens };
    });
}

export async function generateScene(projectId: string, index: number, signal?: AbortSignal) {
  const project = await loadVideo(projectId);
  const scene = project.script?.szenen[index];
  if (!scene) throw new Error("Szene nicht gefunden.");
  const settings = settingsOf(project);
  const seconds = sceneSeconds(project, index);
  const prompt = `${scene.kiPrompt}\nVertical 9:16 smartphone video, realistic, natural light, no text, no captions, no logos.`;
  const setGen = genSetter(projectId, index);
  await setGen({ status: "queued", error: undefined, model: settings.model, prompt, statusUrl: undefined, responseUrl: undefined });
  try {
    const start = await api<{ statusUrl: string; responseUrl: string }>("/api/studio/genvideo", {
      method: "POST",
      body: JSON.stringify({ model: settings.model, prompt, seconds }),
      signal,
    });
    await setGen({ status: "running", statusUrl: start.statusUrl, responseUrl: start.responseUrl });
    await finishScene(projectId, index, start.statusUrl, start.responseUrl, signal);
  } catch (error) {
    if (!signal?.aborted) await setGen({ status: "error", error: error instanceof Error ? error.message : "Fehler" });
    throw error;
  }
}

/** Setzt das Abfragen einer laufenden Generierung fort (z. B. nach Neuladen). */
export async function resumeScene(projectId: string, index: number, signal?: AbortSignal) {
  const project = await loadVideo(projectId);
  const gen = project.generations?.find((g) => g.sceneIndex === index);
  if (!gen?.statusUrl || !gen.responseUrl) return generateScene(projectId, index, signal);
  try {
    await finishScene(projectId, index, gen.statusUrl, gen.responseUrl, signal);
  } catch (error) {
    if (!signal?.aborted) await genSetter(projectId, index)({ status: "error", error: error instanceof Error ? error.message : "Fehler" });
    throw error;
  }
}

async function finishScene(projectId: string, index: number, statusUrl: string, responseUrl: string, signal?: AbortSignal) {
  const videoUrl = await pollGeneration(statusUrl, responseUrl, signal);
  const response = await fetch(videoUrl, { signal });
  if (!response.ok) throw new Error("KI-Clip konnte nicht geladen werden.");
  const blob = await response.blob();
  const typed = blob.type.startsWith("video/") ? blob : new Blob([blob], { type: "video/mp4" });
  const info = await probeMedia(typed);
  const asset = await saveAsset(typed, `szene-${index + 1}.mp4`);
  await patch(projectId, (p) => ({
    sources: [
      ...p.sources.filter((s) => s.sceneIndex !== index),
      {
        id: `S${index + 1}`,
        assetId: asset.id,
        kind: "video",
        name: `KI-Szene ${index + 1}`,
        duration: info.duration,
        width: info.width,
        height: info.height,
        origin: "ai",
        sceneIndex: index,
        transcript: [],
      },
    ],
  }));
  await genSetter(projectId, index)({ status: "done", error: undefined });
}

async function pollGeneration(statusUrl: string, responseUrl: string, signal?: AbortSignal) {
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    await sleep(6000, signal);
    const params = new URLSearchParams({ statusUrl, responseUrl });
    const status = await api<{ status: string; videoUrl?: string; error?: string }>(`/api/studio/genvideo?${params}`, { signal });
    if (status.status === "done" && status.videoUrl) return status.videoUrl;
    if (status.status === "error") throw new ApiError(status.error || "Generierung fehlgeschlagen.", 502);
  }
  throw new ApiError("Die KI-Generierung dauert ungewöhnlich lange.", 504);
}

// ---------------------------------------------------------------------------
// Timeline, Rendern, Rating
// ---------------------------------------------------------------------------

export function buildTimeline(project: VideoProject, client: Client): Timeline {
  const settings = settingsOf(project);
  const opts = {
    captionStyle: project.captionStyle ?? client.brand.captionStyle,
    brand: client.brand,
    captions: settings.captions,
    progressBar: settings.progressBar,
  };
  if (project.mode === "ai" && project.script) {
    const timings =
      project.sceneTimings ??
      project.script.szenen.map((s, index) => ({ index, start: s.start, end: Math.max(s.ende, s.start + 1) }));
    const sceneSources = project.script.szenen.map((_, i) => project.sources.find((s) => s.sceneIndex === i));
    const vo = project.sources.find((s) => s.id === project.voiceover?.sourceId);
    return timelineFromScript(project.script, timings, sceneSources, vo && project.voiceover ? { source: vo, words: project.voiceover.words } : null, opts);
  }
  if (!project.editPlan) throw new Error("Noch kein Schnittplan vorhanden.");
  return timelineFromEditPlan(project.editPlan, project.sources, opts);
}

export async function renderProject(
  projectId: string,
  client: Client,
  quality: "preview" | "final",
  onProgress: (p: number, stage: string) => void,
  signal?: AbortSignal,
): Promise<RenderResult & { assetId?: string }> {
  const project = await loadVideo(projectId);
  const timeline = buildTimeline(project, client);
  const result = await renderTimeline(timeline, (id) => blobFor(project, id), { quality, onProgress, signal });
  if (quality === "preview") return result;
  const asset = await saveAsset(result.blob, `${project.title}.${result.extension}`);
  await patch(projectId, (p) => ({
    renders: [...p.renders, { assetId: asset.id, createdAt: Date.now(), duration: timeline.duration, mime: result.mime }],
    status: p.status === "entwurf" || p.status === "geschnitten" ? "fertig" : p.status,
  }));
  return { ...result, assetId: asset.id };
}

export async function rateRender(projectId: string, client: Client, assetId: string) {
  const project = await loadVideo(projectId);
  const asset = await getAsset(assetId);
  if (!asset) throw new Error("Video nicht gefunden.");
  const render = project.renders.find((r) => r.assetId === assetId);
  const duration = render?.duration ?? (await probeMedia(asset.blob)).duration;
  // Dichter am Anfang samplen – der Hook entscheidet.
  const times = [0.3, 1.2, 2.4, ...spreadTimes(duration, 7)].filter((t) => t < duration).sort((a, b) => a - b);
  const frames = (await extractFrames(asset.blob, times, 512, 0.7)).map((f) => ({ ...f, source: "V" }));
  const timeline = buildTimeline(project, client);
  const hook = timeline.overlays.find((o) => o.kind === "hook")?.text ?? "";
  const kontext = [
    project.script ? `Skript: ${project.script.titel} – ${project.script.kernidee}` : "",
    project.editPlan ? `Schnittkonzept: ${project.editPlan.konzept}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const rating = await runAi("rateVideo", {
    client: toBrief(client),
    kontext,
    dauer: duration,
    woerter: timeline.captions.length ? timeline.captions : collectWords(project),
    hookText: hook,
    frames,
  });
  await patch(projectId, (p) => ({
    renders: p.renders.map((r) => (r.assetId === assetId ? { ...r, rating } : r)),
  }));
  return rating;
}

function collectWords(project: VideoProject) {
  return project.sources.flatMap((s) => s.transcript ?? []).slice(0, 8000);
}

/** Wandelt die Verbesserungsvorschläge des Ratings in einen neuen Schnitt-Wunsch. */
export function improvementBrief(project: VideoProject, assetId: string) {
  const rating = project.renders.find((r) => r.assetId === assetId)?.rating;
  if (!rating) return "";
  return `Verbessere den vorherigen Schnitt (Viral-Score ${Math.round(rating.gesamt)}/100). Umsetzen:\n${rating.verbesserungen
    .filter((v) => v.prioritaet !== "niedrig")
    .map((v) => `- ${v.was} (${v.warum})`)
    .join("\n")}`;
}

// ---------------------------------------------------------------------------
// Autopilot: Skript → Voiceover → KI-Szenen → Rendern → Viral-Check
// ---------------------------------------------------------------------------

export async function autopilot(
  projectId: string,
  client: Client,
  voiceId: string,
  opts: { note: (text: string) => void; signal?: AbortSignal; rate: boolean },
) {
  let project = await loadVideo(projectId);
  if (!project.script) throw new Error("Kein Skript vorhanden.");
  if (!project.voiceover) {
    opts.note("Voiceover wird eingesprochen …");
    await createVoiceover(projectId, voiceId);
    project = await loadVideo(projectId);
  }
  const missing = project.script!.szenen.map((_, i) => i).filter((i) => !project.sources.some((s) => s.sceneIndex === i));
  let done = 0;
  if (missing.length) opts.note(`KI-Szenen werden generiert … 0/${missing.length}`);
  const results = await mapLimit(missing, 3, async (i) => {
    await generateScene(projectId, i, opts.signal);
    done++;
    opts.note(`KI-Szenen werden generiert … ${done}/${missing.length}`);
  });
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed === missing.length && missing.length) {
    const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    throw first.reason instanceof Error ? first.reason : new Error("KI-Szenen fehlgeschlagen.");
  }
  opts.note("Video wird gerendert …");
  const result = await renderProject(projectId, client, "final", () => {}, opts.signal);
  if (opts.rate && result.assetId) {
    opts.note("Viral-Check …");
    await rateRender(projectId, client, result.assetId);
  }
  return { failedScenes: failed };
}
