import { ZodError } from "zod";
import { ScrapeJobSchema, type ScrapeKind } from "@/lib/studio/scrape";
import { pollScrape, startScrape } from "@/lib/studio/server/apify";
import { assertAccess, errorResponse, StudioError } from "@/lib/studio/server/env";

export const maxDuration = 300;

const KINDS: ScrapeKind[] = [
  "tiktok-search",
  "tiktok-profiles",
  "instagram-hashtags",
  "instagram-reels",
  "instagram-profiles",
];

/** Startet einen Scraper-Lauf und gibt die Lauf-ID zurück. */
export async function POST(request: Request) {
  try {
    assertAccess(request);
    const body = await request.json().catch(() => null);
    const job = ScrapeJobSchema.parse(body?.job);
    const runId = await startScrape(job);
    return Response.json({ runId, kind: job.kind });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: `Ungültiger Scrape-Auftrag: ${error.issues[0]?.message}` }, { status: 400 });
    }
    return errorResponse(error);
  }
}

/** Fragt den Status eines Laufs ab; ist er fertig, kommen die Daten mit. */
export async function GET(request: Request) {
  try {
    assertAccess(request);
    const url = new URL(request.url);
    const runId = url.searchParams.get("runId") ?? "";
    const kind = url.searchParams.get("kind") as ScrapeKind;
    if (!KINDS.includes(kind)) throw new StudioError("Unbekannter Scrape-Typ.", 400);
    return Response.json(await pollScrape(runId, kind));
  } catch (error) {
    return errorResponse(error);
  }
}
