"use client";

// Rendert eine Timeline im Browser zu einem fertigen Hochkant-Video:
// Clips dekodieren (WebCodecs), auf 9:16 zuschneiden, Zoom/Untertitel/
// Overlays zeichnen, Ton mischen + normalisieren, als MP4 (H.264/AAC)
// kodieren. Fällt auf WebM (VP9/Opus) zurück, wenn der Browser kein H.264
// kodieren kann.

import {
  AudioBufferSink,
  AudioBufferSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  canEncodeAudio,
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  QUALITY_MEDIUM,
  WebMOutputFormat,
  type Input,
} from "mediabunny";
import { openInput } from "./media";
import { drawCaptions, drawChrome, drawOverlays, paginateCaptions } from "./overlays";
import type { Timeline, VideoClip, Zoom } from "./timeline";

export type RenderResult = { blob: Blob; mime: string; extension: "mp4" | "webm"; videoCodec: string };

export type RenderOptions = {
  quality?: "preview" | "final";
  signal?: AbortSignal;
  onProgress?: (progress: number, stage: string) => void;
};

const SAMPLE_RATE = 48_000;

type Handle = { input?: Input; sink?: CanvasSink; image?: ImageBitmap; crop: { left: number; top: number; width: number; height: number } };

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Abgebrochen", "AbortError");
}

export async function canvasFont() {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-work-sans").trim();
  if (family) {
    try {
      await Promise.all([document.fonts.load(`700 80px ${family}`), document.fonts.load(`800 80px ${family}`)]);
    } catch {
      // Fallback-Schrift reicht notfalls.
    }
  }
  return `${family ? `${family}, ` : ""}"Arial Black", Arial, sans-serif`;
}

/** 9:16-Ausschnitt aus der Mitte (leicht nach oben versetzt für Gesichter). */
function coverCrop(srcW: number, srcH: number, outW: number, outH: number) {
  const target = outW / outH;
  if (srcW / srcH > target) {
    const width = Math.round(srcH * target);
    return { left: Math.round((srcW - width) / 2), top: 0, width, height: srcH };
  }
  const height = Math.round(srcW / target);
  return { left: 0, top: Math.round(Math.max(0, (srcH - height) * 0.4)), width: srcW, height };
}

function zoomAt(zoom: Zoom, local: number, dur: number) {
  if (zoom === "leicht") return 1 + 0.07 * Math.min(1, local / Math.max(dur, 0.1));
  if (zoom === "punch") return local < 0.12 ? 1.24 - (0.09 * local) / 0.12 : 1.15;
  return 1;
}

function drawZoomed(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  imgW: number,
  imgH: number,
  crop: Handle["crop"] | null,
  zoom: number,
  W: number,
  H: number,
) {
  const base = crop ?? { left: 0, top: 0, width: imgW, height: imgH };
  const sw = base.width / zoom;
  const sh = base.height / zoom;
  const sx = base.left + (base.width - sw) * 0.5;
  const sy = base.top + (base.height - sh) * 0.42;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}

export async function renderTimeline(tl: Timeline, loadBlob: (sourceId: string) => Promise<Blob>, opts: RenderOptions = {}): Promise<RenderResult> {
  const preview = opts.quality === "preview";
  const scale = preview ? 0.5 : 1;
  const outW = Math.round(tl.width * scale);
  const outH = Math.round(tl.height * scale);
  const fps = preview ? 24 : tl.fps;
  const quality = preview ? QUALITY_MEDIUM : QUALITY_HIGH;
  if (tl.duration <= 0.2) throw new Error("Die Timeline ist leer.");

  opts.onProgress?.(0, "Vorbereiten");
  const videoCodec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: outW, height: outH, quality, frameRate: fps });
  if (!videoCodec) throw new Error("Dieser Browser kann keine Videos kodieren. Bitte ein aktuelles Chrome, Edge oder Safari verwenden.");
  const mp4 = videoCodec === "avc";
  let audioCodec: "aac" | "opus" | null = null;
  if (tl.audio.length) {
    if (mp4) {
      if (!(await canEncodeAudio("aac", { numberOfChannels: 2, sampleRate: SAMPLE_RATE }))) {
        const { registerAacEncoder } = await import("@mediabunny/aac-encoder");
        registerAacEncoder();
      }
      audioCodec = "aac";
    } else {
      audioCodec = "opus";
    }
  }

  opts.onProgress?.(0.02, "Ton mischen");
  const mixed = tl.audio.length ? await mixAudio(tl, loadBlob, opts.signal) : null;
  abortIfNeeded(opts.signal);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingQuality = "high";

  const output = new Output({
    format: mp4 ? new Mp4OutputFormat({ fastStart: "in-memory" }) : new WebMOutputFormat(),
    target: new BufferTarget(),
  });
  const videoSource = new CanvasSource(canvas, { codec: videoCodec, quality });
  output.addVideoTrack(videoSource, { frameRate: fps });
  const audioSource = mixed && audioCodec ? new AudioBufferSource({ codec: audioCodec, quality }) : null;
  if (audioSource) output.addAudioTrack(audioSource);
  await output.start();

  const handles = new Map<string, Handle>();
  const font = await canvasFont();
  const pages = paginateCaptions(tl.captions, tl.captionStyle);
  const logo = tl.brand.logo && tl.brand.watermark ? await createImageBitmap(await (await fetch(tl.brand.logo)).blob()).catch(() => null) : null;

  async function handleFor(sourceId: string): Promise<Handle> {
    const existing = handles.get(sourceId);
    if (existing) return existing;
    const blob = await loadBlob(sourceId);
    let handle: Handle;
    if (blob.type.startsWith("image/")) {
      const image = await createImageBitmap(blob);
      handle = { image, crop: coverCrop(image.width, image.height, tl.width, tl.height) };
    } else {
      const input = openInput(blob);
      const track = await input.getPrimaryVideoTrack();
      if (!track) throw new Error(`Quelle ${sourceId} enthält kein Bild.`);
      const w = await track.getDisplayWidth();
      const h = await track.getDisplayHeight();
      const crop = coverCrop(w, h, tl.width, tl.height);
      const sink = new CanvasSink(track, { crop, width: outW, height: outH, fit: "fill", poolSize: 4 });
      handle = { input, sink, crop: { left: 0, top: 0, width: outW, height: outH } };
    }
    handles.set(sourceId, handle);
    return handle;
  }

  // Frames nach Clip gruppieren (Lücken = Hintergrund in Markenfarbe).
  const total = Math.max(1, Math.round(tl.duration * fps));
  const clips = [...tl.video].sort((a, b) => a.at - b.at);
  const groups: { clip: VideoClip | null; frames: number[] }[] = [];
  let ci = 0;
  for (let k = 0; k < total; k++) {
    const t = k / fps;
    while (ci < clips.length && t >= clips[ci].at + clips[ci].dur) ci++;
    const clip = ci < clips.length && t >= clips[ci].at ? clips[ci] : null;
    const last = groups[groups.length - 1];
    if (last && last.clip === clip) last.frames.push(k);
    else groups.push({ clip, frames: [k] });
  }

  // Ton in 1-Sekunden-Häppchen parallel zum Bild einspeisen.
  let audioFed = 0;
  const feedAudio = async (untilSec: number) => {
    if (!mixed || !audioSource) return;
    const end = Math.min(mixed.length, Math.round(untilSec * SAMPLE_RATE));
    while (audioFed < end) {
      const len = Math.min(SAMPLE_RATE, end - audioFed);
      const chunk = new AudioBuffer({ length: len, numberOfChannels: mixed.numberOfChannels, sampleRate: SAMPLE_RATE });
      for (let ch = 0; ch < mixed.numberOfChannels; ch++) {
        chunk.copyToChannel(mixed.getChannelData(ch).subarray(audioFed, audioFed + len), ch);
      }
      await audioSource.add(chunk);
      audioFed += len;
    }
  };

  let done = 0;
  const drawFrame = async (k: number, base: (() => void) | null) => {
    const t = k / fps;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = tl.brand.primary;
    ctx.fillRect(0, 0, outW, outH);
    if (base) base();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawOverlays(ctx, tl.overlays, t, tl, font);
    drawCaptions(ctx, pages, t, tl, font);
    drawChrome(ctx, t, tl, logo);
    await videoSource.add(t, 1 / fps);
    await feedAudio(t + 1);
    done++;
    if (done % 6 === 0) opts.onProgress?.(0.05 + 0.93 * (done / total), "Rendern");
  };

  try {
    for (const group of groups) {
      abortIfNeeded(opts.signal);
      const clip = group.clip;
      if (!clip) {
        for (const k of group.frames) await drawFrame(k, null);
        continue;
      }
      const handle = await handleFor(clip.sourceId);
      if (handle.image) {
        const img = handle.image;
        for (const k of group.frames) {
          const local = k / fps - clip.at;
          await drawFrame(k, () => drawZoomed(ctx, img, img.width, img.height, handle.crop, zoomAt(clip.zoom === "kein" ? "leicht" : clip.zoom, local, clip.dur), outW, outH));
          abortIfNeeded(opts.signal);
        }
        continue;
      }
      const times = group.frames.map((k) => clip.srcStart + (k / fps - clip.at));
      let i = 0;
      for await (const wrapped of handle.sink!.canvasesAtTimestamps(times)) {
        const k = group.frames[i++];
        const local = k / fps - clip.at;
        await drawFrame(
          k,
          wrapped ? () => drawZoomed(ctx, wrapped.canvas, outW, outH, handle.crop, zoomAt(clip.zoom, local, clip.dur), outW, outH) : null,
        );
        abortIfNeeded(opts.signal);
      }
      // Falls der Clip kürzer ist als geplant: restliche Frames mit Hintergrund füllen.
      while (i < group.frames.length) await drawFrame(group.frames[i++], null);
    }
    await feedAudio(tl.duration + 1);
    opts.onProgress?.(0.99, "Datei schreiben");
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  } finally {
    for (const h of handles.values()) {
      h.input?.dispose();
      h.image?.close();
    }
    logo?.close();
  }

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Rendern fehlgeschlagen.");
  const mime = mp4 ? "video/mp4" : "video/webm";
  opts.onProgress?.(1, "Fertig");
  return { blob: new Blob([buffer], { type: mime }), mime, extension: mp4 ? "mp4" : "webm", videoCodec };
}

/** Mischt alle Tonspuren der Timeline und normalisiert die Lautstärke. */
async function mixAudio(tl: Timeline, loadBlob: (id: string) => Promise<Blob>, signal?: AbortSignal) {
  const length = Math.ceil(tl.duration * SAMPLE_RATE) + 1;
  const ctx = new OfflineAudioContext(2, length, SAMPLE_RATE);
  for (const clip of tl.audio) {
    abortIfNeeded(signal);
    const blob = await loadBlob(clip.sourceId);
    const input = openInput(blob);
    try {
      const track = await input.getPrimaryAudioTrack();
      if (!track || !(await track.canDecode())) continue;
      const sink = new AudioBufferSink(track);
      const parts: AudioBuffer[] = [];
      let firstTimestamp: number | null = null;
      for await (const wrapped of sink.buffers(clip.srcStart, clip.srcStart + clip.dur)) {
        if (firstTimestamp == null) firstTimestamp = wrapped.timestamp;
        parts.push(wrapped.buffer);
      }
      if (!parts.length || firstTimestamp == null) continue;
      const joined = concatBuffers(parts);
      const node = ctx.createBufferSource();
      node.buffer = joined;
      const gain = ctx.createGain();
      node.connect(gain).connect(ctx.destination);
      const fade = 0.012;
      const end = clip.at + clip.dur;
      gain.gain.setValueAtTime(0, clip.at);
      gain.gain.linearRampToValueAtTime(clip.gain, clip.at + fade);
      gain.gain.setValueAtTime(clip.gain, Math.max(clip.at + fade, end - fade));
      gain.gain.linearRampToValueAtTime(0, end);
      const rel = firstTimestamp - clip.srcStart;
      const when = clip.at + Math.max(0, rel);
      const offset = Math.max(0, -rel);
      const playable = Math.min(joined.duration - offset, end - when);
      if (playable > 0) node.start(when, offset, playable);
    } finally {
      input.dispose();
    }
  }
  const rendered = await ctx.startRendering();
  normalize(rendered);
  return rendered;
}

function concatBuffers(parts: AudioBuffer[]) {
  const channels = Math.max(...parts.map((p) => p.numberOfChannels));
  const sampleRate = parts[0].sampleRate;
  const length = parts.reduce((n, p) => n + p.length, 0);
  const out = new AudioBuffer({ length, numberOfChannels: channels, sampleRate });
  for (let ch = 0; ch < channels; ch++) {
    const target = out.getChannelData(ch);
    let offset = 0;
    for (const p of parts) {
      target.set(p.getChannelData(Math.min(ch, p.numberOfChannels - 1)), offset);
      offset += p.length;
    }
  }
  return out;
}

/** Hebt leise Handy-Aufnahmen an (Ziel ca. -18 dBFS RMS), ohne zu clippen. */
function normalize(buffer: AudioBuffer) {
  let peak = 0;
  let sumSq = 0;
  let n = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
      if (v > 0.003) {
        sumSq += v * v;
        n++;
      }
    }
  }
  if (!n || peak < 1e-4) return;
  const rms = Math.sqrt(sumSq / n);
  const gain = Math.min(0.125 / rms, 0.97 / peak, 6);
  if (Math.abs(gain - 1) < 0.05) return;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= gain;
  }
}
