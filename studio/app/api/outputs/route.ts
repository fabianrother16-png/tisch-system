import { listOutputs, newOutput, saveOutput } from "@/lib/db";
import { badRequest, json, readJson } from "@/lib/http";
import { isSegmentSlug } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") ?? undefined;
  const segment = url.searchParams.get("segment");
  return json(await listOutputs({ clientId, segment: isSegmentSlug(segment) ? segment : undefined }));
}

/** Legt eine offene Aufgabe an (wird später im Segment erzeugt). */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!isSegmentSlug(body.segment)) return badRequest("Unbekanntes Segment.");
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) return badRequest("Bitte einen Titel angeben.");
  const output = newOutput({
    segment: body.segment,
    title,
    clientId: typeof body.clientId === "string" && body.clientId ? body.clientId : null,
    prompt: typeof body.prompt === "string" ? body.prompt.slice(0, 20000) : "",
    status: "offen",
    geplantAm: typeof body.geplantAm === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.geplantAm) ? body.geplantAm : null,
    zustaendig: typeof body.zustaendig === "string" ? body.zustaendig.slice(0, 80) : "",
  });
  return json(await saveOutput(output), 201);
}
