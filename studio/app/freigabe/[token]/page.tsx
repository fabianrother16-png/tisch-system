import { notFound } from "next/navigation";
import { FreigabeView } from "@/components/FreigabeView";
import { findOutputByToken, getClient, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Freigabe", robots: { index: false, follow: false } };

/** Öffentliche Seite für Kunden: nur dieses eine Ergebnis, keine internen Daten. */
export default async function FreigabePage({ params }: { params: Promise<{ token: string }> }) {
  const output = await findOutputByToken((await params).token);
  if (!output) notFound();
  const [client, settings] = await Promise.all([output.clientId ? getClient(output.clientId) : Promise.resolve(null), getSettings()]);
  const letzte = output.kundenFeedback.at(-1);
  return (
    <FreigabeView
      token={output.freigabeToken!}
      title={output.title}
      content={output.content}
      clientName={client?.name ?? null}
      agenturName={settings.agenturName}
      agenturWebsite={settings.agenturWebsite}
      status={output.status}
      letzteEntscheidung={letzte ? { entscheidung: letzte.entscheidung, createdAt: letzte.createdAt } : null}
    />
  );
}
