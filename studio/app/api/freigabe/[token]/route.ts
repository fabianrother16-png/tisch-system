import { findOutputByToken, saveOutput } from "@/lib/db";
import { badRequest, json, notFound, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ token: string }> };

/** Öffentlich (geheimer Link): Kunde gibt frei oder wünscht Änderungen. */
export async function POST(req: Request, { params }: Ctx) {
  const output = await findOutputByToken((await params).token);
  if (!output) return notFound("Freigabe");
  const { entscheidung, text } = await readJson(req);
  if (entscheidung !== "freigegeben" && entscheidung !== "aenderung") return badRequest("Ungültige Entscheidung.");
  const kommentar = typeof text === "string" ? text.trim().slice(0, 5000) : "";
  if (entscheidung === "aenderung" && !kommentar) return badRequest("Bitte kurz beschreiben, was geändert werden soll.");
  output.kundenFeedback = [...output.kundenFeedback, { entscheidung, text: kommentar, createdAt: new Date().toISOString() }];
  output.status = entscheidung === "freigegeben" ? "freigegeben" : "entwurf";
  await saveOutput(output);
  return json({ ok: true, status: output.status });
}
