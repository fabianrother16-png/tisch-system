import { OutputBoard } from "@/components/OutputBoard";
import { listClients, listOutputs } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ergebnisse" };

export default async function ErgebnissePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [clients, outputs, sp] = await Promise.all([listClients(), listOutputs(), searchParams]);
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h1 className="h-page">Ergebnisse</h1>
        <p className="text-sm text-anthracite/60">Alle Lieferungen vom offenen Auftrag bis zur Veröffentlichung.</p>
      </div>
      <OutputBoard
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        outputs={outputs.map(({ content: _c, versionen: _v, ...o }) => ({ ...o, hasContent: Boolean(_c) }))}
        initialStatus={sp.status}
      />
    </div>
  );
}
