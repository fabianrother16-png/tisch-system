import Link from "next/link";
import { Plus } from "lucide-react";
import { ClientStatusBadge } from "@/components/StatusBadge";
import { listClients, listOutputs } from "@/lib/db";
import { getPaket } from "@/lib/pakete";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kunden" };

export default async function KundenPage() {
  const [clients, outputs] = await Promise.all([listClients(), listOutputs()]);
  const count = (clientId: string, status: string[]) => outputs.filter((o) => o.clientId === clientId && status.includes(o.status)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-page">Kunden</h1>
          <p className="text-sm text-anthracite/60">Die Kundenakte ist das Gedächtnis aller Agenten – je vollständiger, desto besser die Ergebnisse.</p>
        </div>
        <Link href="/kunden/neu" className="btn-primary">
          <Plus className="h-4 w-4" /> Neuer Kunde
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card p-10 text-center">
          <h2 className="font-serif text-xl font-semibold">Noch keine Kunden</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-anthracite/60">
            Lege den ersten Kunden an. Mit „Mit KI recherchieren“ füllt der Strategie-Agent die Kundenakte aus Website, Google-Profil und Social Media vor.
          </p>
          <Link href="/kunden/neu" className="btn-primary mt-5">
            <Plus className="h-4 w-4" /> Ersten Kunden anlegen
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/kunden/${c.id}`} className="card flex flex-col gap-3 p-4 transition-colors hover:border-terracotta/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-serif text-lg font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-anthracite/60">{[c.branche, c.ort].filter(Boolean).join(" · ") || "Branche/Ort fehlen"}</div>
                </div>
                <ClientStatusBadge status={c.status} />
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="chip">Paket: {getPaket(c.paket)?.label}</span>
                <span className="chip">{count(c.id, ["offen", "entwurf", "pruefung"])} in Arbeit</span>
                <span className="chip">{count(c.id, ["freigabe"])} beim Kunden</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
