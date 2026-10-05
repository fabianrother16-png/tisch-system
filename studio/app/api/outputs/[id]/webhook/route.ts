import { getClient, getOutput, getSettings } from "@/lib/db";
import { json, notFound } from "@/lib/http";
import { getSegment } from "@/lib/segments";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Schickt ein Ergebnis an die in den Einstellungen hinterlegte Webhook-URL (Make, n8n, Zapier …).
 * Von dort aus geht es weiter: Google Drive, Planungstools, Slack, Higgsfield-Workflows, Buchhaltung.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const output = await getOutput((await params).id);
  if (!output) return notFound("Ergebnis");
  const settings = await getSettings();
  if (!settings.webhookUrl) return json({ error: "Keine Webhook-URL in den Einstellungen hinterlegt." }, 400);
  const client = output.clientId ? await getClient(output.clientId) : null;
  const { versionen: _versionen, freigabeToken: _token, ...ergebnis } = output;

  try {
    const res = await fetch(settings.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "studio.ergebnis",
        gesendetAm: new Date().toISOString(),
        segment: getSegment(output.segment)?.label ?? output.segment,
        ergebnis,
        kunde: client,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return json({ error: `Webhook antwortet mit ${res.status}.` }, 502);
    return json({ ok: true });
  } catch (err) {
    return json({ error: `Webhook nicht erreichbar: ${err instanceof Error ? err.message : String(err)}` }, 502);
  }
}
