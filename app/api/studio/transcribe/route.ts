import { assertAccess, errorResponse, StudioError } from "@/lib/studio/server/env";
import { transcribe } from "@/lib/studio/server/elevenlabs";

export const maxDuration = 300;

// Nimmt eine (im Browser komprimierte) Tonspur entgegen und liefert Wörter
// mit Zeitstempeln. Vercel begrenzt Request-Bodies auf ca. 4,5 MB – der
// Browser teilt lange Aufnahmen deshalb vorher in Stücke.
export async function POST(request: Request) {
  try {
    assertAccess(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) throw new StudioError("Keine Audiodatei erhalten.", 400);
    if (file.size > 4_400_000) throw new StudioError("Audiostück zu groß (max. ca. 4 MB).", 413);
    const language = String(form.get("language") ?? "de").slice(0, 5);
    return Response.json(await transcribe(file, language));
  } catch (error) {
    return errorResponse(error);
  }
}
