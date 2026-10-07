// ElevenLabs: Spracherkennung mit Wort-Zeitstempeln (Untertitel, Schnitt)
// und Sprachausgabe mit Zeitstempeln (Voiceover für KI-Videos).

import type { TranscriptWord } from "../types";
import { env, requireKey, StudioError } from "./env";

const API = () => process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io";

function key() {
  return requireKey(env.elevenLabsKey(), "ELEVENLABS_API_KEY", "ohne ElevenLabs gibt es keine automatischen Untertitel und keine Sprecherstimme");
}

async function check(response: Response) {
  if (response.ok) return response;
  const text = await response.text().catch(() => "");
  if (response.status === 401) throw new StudioError("ELEVENLABS_API_KEY ist ungültig oder hat keine Berechtigung.", 503);
  if (response.status === 429) throw new StudioError("ElevenLabs ist ausgelastet oder das Kontingent ist aufgebraucht.", 429);
  throw new StudioError(`ElevenLabs-Fehler ${response.status}: ${text.slice(0, 300)}`, 502);
}

export async function transcribe(file: Blob, language: string): Promise<{ words: TranscriptWord[]; text: string; duration: number }> {
  const form = new FormData();
  form.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v2");
  form.append("file", file, file instanceof File ? file.name : "audio.ogg");
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "false");
  if (language) form.append("language_code", language);
  const response = await check(
    await fetch(`${API()}/v1/speech-to-text`, { method: "POST", headers: { "xi-api-key": key() }, body: form }),
  );
  const data = (await response.json()) as {
    text?: string;
    audio_duration_secs?: number;
    words?: { text: string; start: number; end: number; type: string }[];
  };
  const words = (data.words ?? [])
    .filter((w) => w.type === "word" && w.text.trim())
    .map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
  return { words, text: data.text ?? "", duration: data.audio_duration_secs ?? 0 };
}

export type Voice = { id: string; name: string; labels: Record<string, string>; previewUrl?: string; category?: string };

export async function listVoices(): Promise<Voice[]> {
  const response = await check(await fetch(`${API()}/v1/voices`, { headers: { "xi-api-key": key() }, cache: "no-store" }));
  const data = (await response.json()) as {
    voices?: { voice_id: string; name: string; labels?: Record<string, string>; preview_url?: string; category?: string }[];
  };
  return (data.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    labels: v.labels ?? {},
    previewUrl: v.preview_url,
    category: v.category,
  }));
}

/**
 * Text → Sprache inkl. Zeichen-Zeitstempeln. Die Zeitstempel werden zu
 * Wort-Zeiten zusammengefasst (für Untertitel) und als Zeichen-Startzeiten
 * zurückgegeben (um Szenen dem Voiceover zuzuordnen).
 */
export async function speak(text: string, voiceId: string, speed: number) {
  if (!/^[A-Za-z0-9]{8,40}$/.test(voiceId)) throw new StudioError("Ungültige Stimmen-ID.", 400);
  const response = await check(
    await fetch(`${API()}/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key(), "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2",
        language_code: "de",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed },
      }),
    }),
  );
  const data = (await response.json()) as {
    audio_base64: string;
    alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };
  const alignment = data.alignment;
  const charStarts = alignment?.character_start_times_seconds ?? [];
  const words: TranscriptWord[] = [];
  if (alignment) {
    let current = "";
    let start = 0;
    let end = 0;
    alignment.characters.forEach((ch, i) => {
      if (/\s/.test(ch)) {
        if (current) words.push({ text: current, start, end });
        current = "";
        return;
      }
      if (!current) start = alignment.character_start_times_seconds[i];
      current += ch;
      end = alignment.character_end_times_seconds[i];
    });
    if (current) words.push({ text: current, start, end });
  }
  return { audioBase64: data.audio_base64, words, charStarts };
}
