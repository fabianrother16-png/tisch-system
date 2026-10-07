"use client";

// Medien-Helfer im Browser: Metadaten lesen, Standbilder für die KI ziehen,
// Tonspur für die Transkription komprimieren. Alles lokal über WebCodecs
// (Mediabunny) – Rohvideos verlassen nie den Rechner.

import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  canEncodeAudio,
  CanvasSink,
  Conversion,
  Input,
  OggOutputFormat,
  Output,
  WavOutputFormat,
} from "mediabunny";

export type MediaInfo = {
  kind: "video" | "audio" | "image";
  duration: number;
  width?: number;
  height?: number;
  hasAudio: boolean;
};

export function openInput(blob: Blob) {
  return new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
}

export async function probeMedia(blob: Blob): Promise<MediaInfo> {
  if (blob.type.startsWith("image/")) {
    const bitmap = await createImageBitmap(blob);
    const info: MediaInfo = { kind: "image", duration: 4, width: bitmap.width, height: bitmap.height, hasAudio: false };
    bitmap.close();
    return info;
  }
  const input = openInput(blob);
  try {
    const [video, audio] = await Promise.all([input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack()]);
    if (!video && !audio) throw new Error("Datei enthält weder Bild noch Ton.");
    const duration = await input.computeDuration();
    if (video) {
      if (!(await video.canDecode())) {
        throw new Error("Dieses Videoformat kann der Browser nicht dekodieren. Bitte als MP4 (H.264) exportieren.");
      }
      return {
        kind: "video",
        duration,
        width: await video.getDisplayWidth(),
        height: await video.getDisplayHeight(),
        hasAudio: Boolean(audio && (await audio.canDecode())),
      };
    }
    return { kind: "audio", duration, hasAudio: true };
  } finally {
    input.dispose();
  }
}

/** JPEG-Standbilder (max. `maxSide` px) zu den angegebenen Zeitpunkten. */
export async function extractFrames(blob: Blob, times: number[], maxSide = 512, quality = 0.72): Promise<{ t: number; dataUrl: string }[]> {
  if (blob.type.startsWith("image/")) {
    const bitmap = await createImageBitmap(blob);
    const canvas = scaleToCanvas(bitmap, bitmap.width, bitmap.height, maxSide);
    bitmap.close();
    return [{ t: 0, dataUrl: canvas.toDataURL("image/jpeg", quality) }];
  }
  const input = openInput(blob);
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) return [];
    const w = await track.getDisplayWidth();
    const h = await track.getDisplayHeight();
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const sink = new CanvasSink(track, { width: Math.round(w * scale), height: Math.round(h * scale), fit: "fill" });
    const sorted = [...times].sort((a, b) => a - b);
    const out: { t: number; dataUrl: string }[] = [];
    let i = 0;
    for await (const wrapped of sink.canvasesAtTimestamps(sorted)) {
      const t = sorted[i++];
      if (!wrapped) continue;
      out.push({ t, dataUrl: canvasToDataUrl(wrapped.canvas, quality) });
    }
    return out;
  } finally {
    input.dispose();
  }
}

function scaleToCanvas(source: CanvasImageSource, w: number, h: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement | OffscreenCanvas, quality: number) {
  if (canvas instanceof HTMLCanvasElement) return canvas.toDataURL("image/jpeg", quality);
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext("2d")!.drawImage(canvas, 0, 0);
  return copy.toDataURL("image/jpeg", quality);
}

/** Gleichmäßig verteilte Zeitpunkte (ohne die allerersten/letzten Frames). */
export function spreadTimes(duration: number, count: number) {
  if (duration <= 0 || count <= 0) return [0];
  const step = duration / (count + 1);
  return Array.from({ length: count }, (_, i) => Math.min(duration - 0.05, step * (i + 1)));
}

/**
 * Extrahiert die Tonspur als Mono-Opus (32 kbit/s) – ca. 4 KB pro Sekunde,
 * damit auch lange Clips unter dem Upload-Limit der Server-Funktion bleiben.
 * Lange Aufnahmen werden in Stücke geteilt. Browser ohne Opus-Encoder
 * bekommen 16-kHz-WAV in kürzeren Stücken.
 */
export async function extractSpeechAudio(blob: Blob, duration: number): Promise<{ start: number; blob: Blob }[]> {
  const opus = await canEncodeAudio("opus", { numberOfChannels: 1, sampleRate: 48_000 });
  const chunkSec = opus ? 600 : 110;
  const chunks: { start: number; blob: Blob }[] = [];
  for (let start = 0; start < duration; start += chunkSec) {
    const end = Math.min(duration, start + chunkSec);
    const input = openInput(blob);
    try {
      const output = opus
        ? new Output({ format: new OggOutputFormat(), target: new BufferTarget() })
        : new Output({ format: new WavOutputFormat(), target: new BufferTarget() });
      const conversion = await Conversion.init({
        input,
        output,
        video: { discard: true },
        audio: opus
          ? { codec: "opus", bitrate: 32_000, numberOfChannels: 1, sampleRate: 48_000, forceTranscode: true }
          : { codec: "pcm-s16", numberOfChannels: 1, sampleRate: 16_000, forceTranscode: true },
        trim: { start, end },
        showWarnings: false,
      });
      if (!conversion.isValid) throw new Error("Tonspur konnte nicht gelesen werden.");
      await conversion.execute();
      const buffer = output.target.buffer;
      if (buffer) chunks.push({ start, blob: new Blob([buffer], { type: opus ? "audio/ogg" : "audio/wav" }) });
    } finally {
      input.dispose();
    }
  }
  return chunks;
}
