import { getOutput, newFreigabeToken, saveOutput } from "@/lib/db";
import { json, notFound } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Erzeugt den geheimen Freigabe-Link für den Kunden und setzt den Status auf „beim Kunden“. */
export async function POST(_req: Request, { params }: Ctx) {
  const output = await getOutput((await params).id);
  if (!output) return notFound("Ergebnis");
  if (!output.content.trim()) return json({ error: "Es gibt noch keinen Inhalt zum Freigeben." }, 400);
  output.freigabeToken ??= newFreigabeToken();
  output.status = "freigabe";
  await saveOutput(output);
  return json({ token: output.freigabeToken });
}

/** Link widerrufen. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const output = await getOutput((await params).id);
  if (!output) return notFound("Ergebnis");
  output.freigabeToken = null;
  if (output.status === "freigabe") output.status = "entwurf";
  await saveOutput(output);
  return json({ ok: true });
}
