import { getClient, listOutputs, newOutput, saveOutput } from "@/lib/db";
import { badRequest, json, notFound, readJson } from "@/lib/http";
import { aufgabenFuer, monatLabel } from "@/lib/pakete";

type Ctx = { params: Promise<{ id: string }> };

/** Monats-Autopilot: legt die wiederkehrenden Lieferungen des Pakets als offene Aufgaben an. */
export async function POST(req: Request, { params }: Ctx) {
  const client = await getClient((await params).id);
  if (!client) return notFound("Kunde");
  const { monat } = await readJson(req);
  if (typeof monat !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monat)) return badRequest("Monat im Format JJJJ-MM angeben.");

  const label = monatLabel(monat);
  const vorhandene = new Set((await listOutputs({ clientId: client.id })).map((o) => o.title));
  const aufgaben = aufgabenFuer(client.paket, client.leistungen);
  const angelegt = [];
  for (const [i, a] of aufgaben.entries()) {
    const title = a.titel.replaceAll("{monat}", label);
    if (vorhandene.has(title)) continue;
    // Über den Monat verteilen, damit der Kalender realistisch aussieht.
    const tag = String(Math.min(28, 1 + Math.floor((i * 27) / Math.max(1, aufgaben.length)))).padStart(2, "0");
    angelegt.push(
      await saveOutput(
        newOutput({
          clientId: client.id,
          segment: a.segment,
          title,
          prompt: a.prompt.replaceAll("{monat}", label),
          status: "offen",
          geplantAm: `${monat}-${tag}`,
        }),
      ),
    );
  }
  return json({ angelegt: angelegt.length, uebersprungen: aufgaben.length - angelegt.length });
}
