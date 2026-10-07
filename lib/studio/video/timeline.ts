// Zeitleiste eines Videos: welche Clips wann laufen, welche Tonspuren
// gemischt werden, Untertitel und Text-Overlays. Wird aus dem KI-Schnittplan
// (eigene Clips) oder aus Skript + Voiceover (KI-Video) gebaut und dann vom
// Renderer in ein MP4 verwandelt.

import type { EditPlan, Script } from "../schemas";
import type { BrandKit, CaptionStyleId, MediaSource, TranscriptWord } from "../types";

export const OUT_W = 1080;
export const OUT_H = 1920;
export const FPS = 30;

export type Zoom = "kein" | "leicht" | "punch";

export type VideoClip = { sourceId: string; at: number; srcStart: number; dur: number; zoom: Zoom };
export type AudioClip = { sourceId: string; at: number; srcStart: number; dur: number; gain: number };
export type TextOverlay = { text: string; start: number; end: number; kind: "hook" | "info" };

export type Timeline = {
  width: number;
  height: number;
  fps: number;
  duration: number;
  video: VideoClip[];
  audio: AudioClip[];
  captions: TranscriptWord[];
  captionStyle: CaptionStyleId;
  overlays: TextOverlay[];
  brand: Pick<BrandKit, "primary" | "accent" | "logo" | "watermark">;
  progressBar: boolean;
};

export type TimelineOptions = {
  captionStyle: CaptionStyleId;
  brand: BrandKit;
  captions: boolean;
  progressBar: boolean;
};

const HOOK_SECONDS = 2.6;

function base(opts: TimelineOptions): Omit<Timeline, "duration" | "video" | "audio" | "captions" | "overlays"> {
  return {
    width: OUT_W,
    height: OUT_H,
    fps: FPS,
    captionStyle: opts.captionStyle,
    brand: { primary: opts.brand.primary, accent: opts.brand.accent, logo: opts.brand.logo, watermark: opts.brand.watermark },
    progressBar: opts.progressBar,
  };
}

/** Eigene Clips: Segmente des KI-Schnittplans hintereinander. */
export function timelineFromEditPlan(plan: EditPlan, sources: MediaSource[], opts: TimelineOptions): Timeline {
  const byId = new Map(sources.map((s) => [s.id.toUpperCase(), s]));
  const video: VideoClip[] = [];
  const audio: AudioClip[] = [];
  const captions: TranscriptWord[] = [];
  const overlays: TextOverlay[] = [];
  let t = 0;

  for (const seg of plan.segmente) {
    const src = byId.get(seg.quelle.trim().toUpperCase());
    if (!src) continue;
    const start = Math.max(0, Math.min(seg.start, src.duration));
    const end = Math.max(0, Math.min(seg.ende, src.duration));
    const dur = end - start;
    if (dur < 0.25) continue;
    if (src.kind !== "audio") video.push({ sourceId: src.id, at: t, srcStart: start, dur, zoom: seg.zoom });
    if (src.kind !== "image") audio.push({ sourceId: src.id, at: t, srcStart: start, dur, gain: 1 });
    for (const w of src.transcript ?? []) {
      if (w.start >= start - 0.05 && w.end <= end + 0.15) {
        captions.push({ text: w.text, start: t + Math.max(0, w.start - start), end: t + Math.min(dur, w.end - start) });
      }
    }
    if (seg.textEinblendung.trim()) overlays.push({ text: seg.textEinblendung.trim(), start: t, end: t + dur, kind: "info" });
    t += dur;
  }

  if (plan.hookText.trim() && t > 0) {
    overlays.unshift({ text: plan.hookText.trim(), start: 0, end: Math.min(HOOK_SECONDS, t), kind: "hook" });
  }

  return {
    ...base(opts),
    duration: t,
    video,
    audio,
    captions: opts.captions && plan.untertitel ? captions : [],
    overlays: dropOverlapsWithHook(overlays),
  };
}

/** Info-Overlays, die mit dem Hook kollidieren, erst nach dem Hook zeigen. */
function dropOverlapsWithHook(overlays: TextOverlay[]) {
  const hook = overlays.find((o) => o.kind === "hook");
  if (!hook) return overlays;
  return overlays
    .map((o) => (o.kind === "info" && o.start < hook.end ? { ...o, start: hook.end } : o))
    .filter((o) => o.end - o.start > 0.6);
}

export type SceneTiming = { index: number; start: number; end: number };

/**
 * Ordnet die Szenen eines Skripts dem Voiceover zu: Jede Szene beginnt bei
 * ihrem ersten gesprochenen Wort. Szenen ohne Text bekommen ihre Skript-
 * Dauer.
 */
export function sceneTimingsFromVoiceover(script: Script, sceneCharStarts: number[], charTimes: number[], voDuration: number): SceneTiming[] {
  const timings: SceneTiming[] = [];
  let cursor = 0;
  script.szenen.forEach((scene, index) => {
    const charIndex = sceneCharStarts[index];
    const spokenStart = charIndex >= 0 && charIndex < charTimes.length ? charTimes[charIndex] : null;
    const start = index === 0 ? 0 : spokenStart ?? cursor;
    timings.push({ index, start: Math.max(start, cursor), end: 0 });
    cursor = Math.max(start, cursor) + (spokenStart == null ? Math.max(1.5, scene.ende - scene.start) : 0.5);
  });
  for (let i = 0; i < timings.length; i++) {
    const next = timings[i + 1];
    timings[i].end = next ? Math.max(timings[i].start + 0.8, next.start) : Math.max(voDuration + 0.4, timings[i].start + 1.5);
  }
  // Nachfolger, die durch das Mindestmaß überholt wurden, nachziehen.
  for (let i = 1; i < timings.length; i++) {
    if (timings[i].start < timings[i - 1].end) timings[i].start = timings[i - 1].end;
    if (timings[i].end <= timings[i].start) timings[i].end = timings[i].start + 0.8;
  }
  return timings;
}

/**
 * KI-Video: Szenen-Clips laufen passend zum Voiceover. Ist ein Clip kürzer
 * als seine Szene, wird er mit Zoom-Variation wiederholt (wirkt wie ein
 * zweiter Schnitt), statt einzufrieren.
 */
export function timelineFromScript(
  script: Script,
  timings: SceneTiming[],
  sceneSources: (MediaSource | undefined)[],
  voiceover: { source: MediaSource; words: TranscriptWord[] } | null,
  opts: TimelineOptions,
): Timeline {
  const video: VideoClip[] = [];
  const overlays: TextOverlay[] = [];
  const zooms: Zoom[] = ["leicht", "punch", "kein"];

  for (const timing of timings) {
    const src = sceneSources[timing.index];
    const sceneDur = timing.end - timing.start;
    if (src && src.kind !== "audio") {
      let at = timing.start;
      let round = 0;
      const clipLen = src.kind === "image" ? sceneDur : Math.max(0.5, src.duration - 0.05);
      while (at < timing.end - 0.05) {
        const dur = Math.min(clipLen, timing.end - at);
        // Wiederholungen starten leicht versetzt, damit es nicht wie ein Loop wirkt.
        const offset = round === 0 || src.kind === "image" ? 0 : Math.min(src.duration - dur, 0.4 * round) || 0;
        video.push({ sourceId: src.id, at, srcStart: Math.max(0, offset), dur, zoom: zooms[(timing.index + round) % zooms.length] });
        at += dur;
        round++;
      }
    }
    const text = script.szenen[timing.index]?.textEinblendung?.trim();
    if (text) overlays.push({ text, start: timing.start, end: timing.end, kind: "info" });
  }

  const duration = Math.max(timings[timings.length - 1]?.end ?? 0, voiceover?.source.duration ?? 0);
  const hookText = script.szenen[0]?.textEinblendung?.trim() || "";
  const withHook: TextOverlay[] = hookText
    ? [{ text: hookText, start: 0, end: Math.min(HOOK_SECONDS + 0.4, timings[0]?.end ?? HOOK_SECONDS), kind: "hook" }, ...overlays.filter((o) => o.start > 0.01)]
    : overlays;

  return {
    ...base(opts),
    duration,
    video,
    audio: voiceover ? [{ sourceId: voiceover.source.id, at: 0, srcStart: 0, dur: voiceover.source.duration, gain: 1 }] : [],
    captions: opts.captions && voiceover ? voiceover.words : [],
    overlays: dropOverlapsWithHook(withHook),
  };
}
