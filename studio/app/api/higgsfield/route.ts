import { badRequest, json, readJson } from "@/lib/http";
import { higgsfieldStatus, higgsfieldSubmit } from "@/lib/tools/higgsfield";

/** Startet eine Generierung (Knopf „Mit Higgsfield erzeugen“). Kostet Higgsfield-Credits. */
export async function POST(req: Request) {
  const { model, input } = await readJson(req);
  if (typeof model !== "string" || !input || typeof input !== "object" || Array.isArray(input)) {
    return badRequest("Modell und Eingabe fehlen.");
  }
  try {
    return json(await higgsfieldSubmit(model, input as Record<string, unknown>));
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return badRequest("id fehlt.");
  try {
    return json(await higgsfieldStatus(id));
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
}
