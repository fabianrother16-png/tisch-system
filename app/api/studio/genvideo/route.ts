import { z, ZodError } from "zod";
import { VIDEO_MODELS, type VideoModelId } from "@/lib/studio/videoModels";
import { assertAccess, env, errorResponse, requireKey, StudioError } from "@/lib/studio/server/env";

export const maxDuration = 60;

const QUEUE = () => process.env.FAL_QUEUE_BASE || "https://queue.fal.run";

function key() {
  return requireKey(env.falKey(), "FAL_KEY", "ohne fal.ai können keine KI-Videoszenen erzeugt werden");
}

async function fal<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Key ${key()}`, "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) throw new StudioError("FAL_KEY ist ungültig.", 503);
    if (response.status === 402) throw new StudioError("fal.ai-Guthaben aufgebraucht.", 402);
    throw new StudioError(`fal.ai-Fehler ${response.status}: ${text.slice(0, 300)}`, 502);
  }
  return (await response.json()) as T;
}

const StartSchema = z.object({
  model: z.enum(Object.keys(VIDEO_MODELS) as [VideoModelId, ...VideoModelId[]]),
  prompt: z.string().trim().min(5).max(2500),
  seconds: z.number().min(1).max(20),
});

/** Startet die Generierung eines Clips (Warteschlange). */
export async function POST(request: Request) {
  try {
    assertAccess(request);
    const { model, prompt, seconds } = StartSchema.parse(await request.json());
    const def = VIDEO_MODELS[model];
    const result = await fal<{ request_id: string; status_url: string; response_url: string }>(`${QUEUE()}/${def.endpoint}`, {
      method: "POST",
      body: JSON.stringify(def.build(prompt, seconds)),
    });
    return Response.json({ requestId: result.request_id, statusUrl: result.status_url, responseUrl: result.response_url });
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Ungültige Eingabe für die Videogenerierung." }, { status: 400 });
    return errorResponse(error);
  }
}

function assertQueueUrl(value: string | null) {
  // Nur fal-Warteschlangen-URLs abfragen – der Schlüssel darf nirgendwo
  // anders hingeschickt werden.
  if (!value) throw new StudioError("URL fehlt.", 400);
  const url = new URL(value);
  const allowed = new URL(QUEUE());
  if (url.origin !== allowed.origin) throw new StudioError("Ungültige Status-URL.", 400);
  return url.toString();
}

/** Status abfragen; wenn fertig, kommt die Video-URL mit. */
export async function GET(request: Request) {
  try {
    assertAccess(request);
    const params = new URL(request.url).searchParams;
    const statusUrl = assertQueueUrl(params.get("statusUrl"));
    const responseUrl = assertQueueUrl(params.get("responseUrl"));
    const status = await fal<{ status: string; queue_position?: number; error?: string }>(statusUrl);
    if (status.status === "COMPLETED") {
      const result = await fal<{ video?: { url?: string } }>(responseUrl);
      const videoUrl = result.video?.url;
      if (!videoUrl) return Response.json({ status: "error", error: status.error || "Kein Video erhalten (evtl. vom Inhaltsfilter blockiert)." });
      return Response.json({ status: "done", videoUrl });
    }
    if (status.error) return Response.json({ status: "error", error: status.error });
    return Response.json({ status: status.status === "IN_QUEUE" ? "queued" : "running", queuePosition: status.queue_position });
  } catch (error) {
    return errorResponse(error);
  }
}
