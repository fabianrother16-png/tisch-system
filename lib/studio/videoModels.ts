// KI-Videomodelle (über fal.ai). Die Eingaben werden pro Modell gebaut, weil
// jedes Modell andere Parameter-Namen und erlaubte Längen hat.

export type VideoModelId = "kling-3" | "veo-3.1-fast";

export const VIDEO_MODELS: Record<
  VideoModelId,
  { endpoint: string; label: string; hint: string; minSec: number; maxSec: number; build: (prompt: string, seconds: number) => Record<string, unknown> }
> = {
  "kling-3": {
    endpoint: "fal-ai/kling-video/v3/standard/text-to-video",
    label: "Kling 3 Standard",
    hint: "Günstig, Clips von 3–15 Sekunden",
    minSec: 3,
    maxSec: 15,
    build: (prompt, seconds) => ({
      prompt,
      duration: String(Math.min(15, Math.max(3, Math.round(seconds)))),
      aspect_ratio: "9:16",
      generate_audio: false,
      negative_prompt: "text, captions, subtitles, watermark, logo, blur, distortion, low quality, deformed hands",
    }),
  },
  "veo-3.1-fast": {
    endpoint: "fal-ai/veo3.1/fast",
    label: "Veo 3.1 Fast",
    hint: "Sehr realistisch, Clips von 4–8 Sekunden",
    minSec: 4,
    maxSec: 8,
    build: (prompt, seconds) => ({
      prompt,
      aspect_ratio: "9:16",
      duration: seconds <= 4 ? "4s" : seconds <= 6 ? "6s" : "8s",
      resolution: "720p",
      generate_audio: false,
      negative_prompt: "text, captions, subtitles, watermark, logo",
    }),
  },
};

export const DEFAULT_VIDEO_MODEL: VideoModelId = "kling-3";
