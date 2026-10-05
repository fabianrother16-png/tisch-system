import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { CommandBar } from "@/components/CommandBar";
import { OutputRow } from "@/components/OutputRow";
import { SegmentIcon } from "@/components/SegmentIcon";
import { getSettings, listClients, listOutputs } from "@/lib/db";
import { currentMonth } from "@/lib/labels";
import { formatUsd } from "@/lib/models";
import { SEGMENTS } from "@/lib/segments";
import { storeIsEphemeral } from "@/lib/store";

export const dynamic = "force-dynamic";

function Kpi({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <div className="text-xs font-semibold uppercase tracking-wide text-anthracite/55">{label}</div>
      <div className="mt-1 font-serif text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-anthracite/55">{hint}</div>}
    </>
  );
  return href ? (
    <Link href={href} className="card p-4 transition-colors hover:border-terracotta/40">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

export default async function Dashboard() {
  const [clients, outputs, settings] = await Promise.all([listClients(), listOutputs(), getSettings()]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const monat = currentMonth();

  const offen = outputs
    .filter((o) => ["offen", "entwurf", "pruefung"].includes(o.status))
    .sort((a, b) => (a.geplantAm ?? "9999").localeCompare(b.geplantAm ?? "9999"));
  const beimKunden = outputs.filter((o) => o.status === "freigabe");
  const kostenMonat = outputs.filter((o) => o.updatedAt.startsWith(monat)).reduce((sum, o) => sum + o.kostenUsd, 0);

  const setup = [
    { done: Boolean(process.env.ANTHROPIC_API_KEY), label: "Claude-API-Schlüssel hinterlegen (ANTHROPIC_API_KEY)", href: "/einstellungen" },
    { done: settings.team.length > 0, label: "Team und Agentur-Angaben in den Einstellungen eintragen", href: "/einstellungen" },
    { done: clients.length > 0, label: "Ersten Kunden mit Kundenakte anlegen", href: "/kunden/neu" },
    { done: Boolean(process.env.APIFY_TOKEN), label: "Optional: Live-Daten aus TikTok, Instagram & Google Maps verbinden (Apify)", href: "/einstellungen", optional: true },
    { done: Boolean(process.env.STUDIO_PASSWORD), label: "Vor dem Online-Stellen: Passwort setzen (STUDIO_PASSWORD)", href: "/einstellungen" },
  ];
  // Die Liste verschwindet, sobald alle Pflichtschritte erledigt sind.
  const setupOffen = setup.filter((s) => !s.done && !("optional" in s)).length;

  const begruessung = (() => {
    const h = Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", hour12: false, timeZone: "Europe/Berlin" }).format(new Date()));
    return h < 11 ? "Guten Morgen" : h < 18 ? "Hallo" : "Guten Abend";
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm text-anthracite/60">
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" })}
        </p>
        <h1 className="h-page">
          {begruessung}
          {settings.team.length ? `, ${settings.team.join(" & ")}` : ""}.
        </h1>
      </div>

      {storeIsEphemeral() && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Achtung: Das Studio läuft auf Vercel ohne Datenbank – Daten gehen bei jedem Neustart verloren. Verbindet unter
          Vercel → Storage „Upstash for Redis“ (siehe README).
        </div>
      )}

      <CommandBar clients={clients.map((c) => ({ id: c.id, name: c.name }))} />

      {setupOffen > 0 && (
        <div className="card p-5">
          <h2 className="h-section">Erste Schritte</h2>
          <ul className="mt-3 space-y-2">
            {setup.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-2 text-sm hover:text-terracotta-dark">
                  {s.done ? <Check className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-anthracite/30" />}
                  <span className={s.done ? "text-anthracite/45 line-through" : ""}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Aktive Kunden" value={clients.filter((c) => c.status === "aktiv").length} hint={`${clients.length} insgesamt`} href="/kunden" />
        <Kpi label="In Arbeit" value={offen.length} hint="offen, Entwurf, Prüfung" href="/ergebnisse" />
        <Kpi label="Beim Kunden" value={beimKunden.length} hint="warten auf Freigabe" href="/ergebnisse?status=freigabe" />
        <Kpi label="KI-Kosten" value={formatUsd(kostenMonat)} hint="diesen Monat" />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="h-section">Segmente</h2>
          <span className="text-xs text-anthracite/55">Jedes Segment ist ein spezialisierter Agent</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SEGMENTS.map((s) => (
            <Link
              key={s.slug}
              href={`/segment/${s.slug}`}
              className="card group flex flex-col gap-2 p-4 transition-all hover:-translate-y-0.5 hover:border-terracotta/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-anthracite text-cream group-hover:bg-terracotta">
                <SegmentIcon slug={s.slug} className="h-4 w-4" />
              </span>
              <span className="font-semibold leading-tight">{s.label}</span>
              <span className="text-xs leading-snug text-anthracite/60">{s.kurz}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 p-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="h-section">Als Nächstes</h2>
            <Link href="/ergebnisse" className="flex items-center gap-1 text-xs font-semibold text-terracotta-dark">
              Alle <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {offen.length ? (
            offen.slice(0, 8).map((o) => <OutputRow key={o.id} output={o} clientName={clientName.get(o.clientId ?? "")} />)
          ) : (
            <p className="px-2 py-4 text-sm text-anthracite/55">
              Nichts offen. Startet oben einen Auftrag oder bereitet bei einem Kunden den Monat vor.
            </p>
          )}
        </section>
        <section className="card min-w-0 p-4">
          <div className="mb-2 px-2">
            <h2 className="h-section">Beim Kunden zur Freigabe</h2>
          </div>
          {beimKunden.length ? (
            beimKunden.slice(0, 8).map((o) => <OutputRow key={o.id} output={o} clientName={clientName.get(o.clientId ?? "")} />)
          ) : (
            <p className="px-2 py-4 text-sm text-anthracite/55">Aktuell wartet nichts auf eine Kundenfreigabe.</p>
          )}
          <div className="mb-2 mt-5 px-2">
            <h2 className="h-section">Zuletzt erstellt</h2>
          </div>
          {outputs.slice(0, 5).map((o) => (
            <OutputRow key={o.id} output={o} clientName={clientName.get(o.clientId ?? "")} />
          ))}
          {outputs.length === 0 && <p className="px-2 py-4 text-sm text-anthracite/55">Noch keine Ergebnisse.</p>}
        </section>
      </div>
    </div>
  );
}
