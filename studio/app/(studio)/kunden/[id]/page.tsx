import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AutopilotPanel } from "@/components/AutopilotPanel";
import { ClientDangerZone } from "@/components/ClientDangerZone";
import { ClientForm } from "@/components/ClientForm";
import { CopyButton } from "@/components/CopyButton";
import { OutputRow } from "@/components/OutputRow";
import { SegmentIcon } from "@/components/SegmentIcon";
import { ClientStatusBadge } from "@/components/StatusBadge";
import { getClient, listOutputs } from "@/lib/db";
import { kundenakteText } from "@/lib/kundenakte";
import { formatUsd } from "@/lib/models";
import { getPaket } from "@/lib/pakete";
import { SEGMENTS } from "@/lib/segments";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const client = await getClient((await params).id);
  return { title: client?.name ?? "Kunde" };
}

function link(value: string, kind: "web" | "insta" | "tiktok") {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const handle = value.replace(/^@/, "");
  if (kind === "insta") return `https://www.instagram.com/${handle}/`;
  if (kind === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return `https://${value}`;
}

export default async function KundePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const outputs = await listOutputs({ clientId: id });
  const kosten = outputs.reduce((s, o) => s + o.kostenUsd, 0);
  const links = [
    { label: "Website", href: link(client.website, "web") },
    { label: "Instagram", href: link(client.instagram, "insta") },
    { label: "TikTok", href: link(client.tiktok, "tiktok") },
    { label: "Google-Profil", href: /^https?:\/\//.test(client.googleProfil) ? client.googleProfil : null },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/kunden" className="text-xs font-semibold text-anthracite/50 hover:text-terracotta-dark">
            ← Kunden
          </Link>
          <h1 className="h-page mt-1">{client.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-anthracite/65">
            <ClientStatusBadge status={client.status} />
            <span>{[client.branche, client.ort].filter(Boolean).join(" · ")}</span>
            <span className="chip">Paket: {getPaket(client.paket)?.label}</span>
            <span className="chip">KI-Kosten gesamt: {formatUsd(kosten)}</span>
          </div>
          {links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-terracotta-dark hover:underline">
                  <ExternalLink className="h-3 w-3" /> {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <CopyButton text={kundenakteText(client)} label="Kundenakte kopieren (für Claude)" className="btn-secondary" />
      </div>

      <section>
        <h2 className="h-section mb-3">Für {client.name} bauen</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {SEGMENTS.filter((s) => !s.ohneKunde).map((s) => (
            <Link
              key={s.slug}
              href={`/segment/${s.slug}?kunde=${client.id}`}
              className="card flex items-center gap-2 p-3 text-sm font-medium transition-colors hover:border-terracotta/50"
            >
              <SegmentIcon slug={s.slug} className="h-4 w-4 shrink-0 text-terracotta" />
              <span className="leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <AutopilotPanel
        clientId={client.id}
        paket={client.paket}
        tasks={outputs.map((o) => ({ id: o.id, title: o.title, segment: o.segment, status: o.status, geplantAm: o.geplantAm, prompt: o.prompt }))}
      />

      <section className="card p-4">
        <h2 className="h-section mb-2 px-2">Alle Ergebnisse ({outputs.length})</h2>
        {outputs.length ? (
          outputs.map((o) => <OutputRow key={o.id} output={o} />)
        ) : (
          <p className="px-2 py-3 text-sm text-anthracite/55">Noch keine Ergebnisse für diesen Kunden.</p>
        )}
      </section>

      <section id="kundenakte">
        <h2 className="h-section mb-3">Kundenakte</h2>
        <ClientForm client={client} />
      </section>

      <ClientDangerZone clientId={client.id} name={client.name} />
    </div>
  );
}
