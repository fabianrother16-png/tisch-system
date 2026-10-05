import { notFound } from "next/navigation";
import { OutputDetail } from "@/components/OutputDetail";
import { getClient, getOutput, getSettings, listClients } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const output = await getOutput((await params).id);
  return { title: output?.title ?? "Ergebnis" };
}

export default async function ErgebnisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const output = await getOutput(id);
  if (!output) notFound();
  const [client, clients, settings] = await Promise.all([
    output.clientId ? getClient(output.clientId) : Promise.resolve(null),
    listClients(),
    getSettings(),
  ]);
  return (
    <OutputDetail
      output={output}
      client={client ? { id: client.id, name: client.name, ansprechpartner: client.ansprechpartner } : null}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      webhook={Boolean(settings.webhookUrl)}
      agenturName={settings.agenturName}
    />
  );
}
