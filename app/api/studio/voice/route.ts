import { z, ZodError } from "zod";
import { assertAccess, errorResponse } from "@/lib/studio/server/env";
import { listVoices, speak } from "@/lib/studio/server/elevenlabs";

export const maxDuration = 120;

/** Verfügbare Stimmen des ElevenLabs-Kontos. */
export async function GET(request: Request) {
  try {
    assertAccess(request);
    return Response.json({ voices: await listVoices(), defaultVoice: process.env.ELEVENLABS_VOICE_ID ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}

const SpeakSchema = z.object({
  text: z.string().trim().min(1).max(4500),
  voiceId: z.string(),
  speed: z.number().min(0.7).max(1.2).default(1.05),
});

/** Voiceover erzeugen (MP3 als Base64 + Wort-Zeitstempel). */
export async function POST(request: Request) {
  try {
    assertAccess(request);
    const { text, voiceId, speed } = SpeakSchema.parse(await request.json());
    return Response.json(await speak(text, voiceId, speed));
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Ungültige Eingabe für die Sprachausgabe." }, { status: 400 });
    return errorResponse(error);
  }
}
