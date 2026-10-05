import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SegmentIcon } from "@/components/SegmentIcon";
import { listClients, listOutputs } from "@/lib/db";
import { OUTPUT_STATUS_STYLE, currentMonth, formatDate, today } from "@/lib/labels";
import { monatLabel } from "@/lib/pakete";
import type { Output } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kalender" };

function shift(monat: string, delta: number) {
  const [y, m] = monat.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function KalenderPage({ searchParams }: { searchParams: Promise<{ monat?: string; kunde?: string }> }) {
  const sp = await searchParams;
  const monat = sp.monat && /^\d{4}-\d{2}$/.test(sp.monat) ? sp.monat : currentMonth();
  const [clients, outputs] = await Promise.all([listClients(), listOutputs()]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const items = outputs.filter((o) => o.geplantAm?.startsWith(monat) && (!sp.kunde || o.clientId === sp.kunde));
  const ohneTermin = outputs.filter((o) => !o.geplantAm && ["offen", "entwurf", "pruefung"].includes(o.status) && (!sp.kunde || o.clientId === sp.kunde));

  const byDay = new Map<string, Output[]>();
  for (const o of items) byDay.set(o.geplantAm!, [...(byDay.get(o.geplantAm!) ?? []), o]);

  const [y, m] = monat.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Montag = 0
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${monat}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);
  const heute = today();
  const query = (mo: string) => `/kalender?monat=${mo}${sp.kunde ? `&kunde=${sp.kunde}` : ""}`;

  const entry = (o: Output) => (
    <Link
      key={o.id}
      href={`/ergebnisse/${o.id}`}
      className={`flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[11px] ${OUTPUT_STATUS_STYLE[o.status]}`}
      title={`${o.title} – ${clientName.get(o.clientId ?? "") ?? "ohne Kunde"}`}
    >
      <SegmentIcon slug={o.segment} className="h-3 w-3 shrink-0" />
      <span className="truncate">{clientName.get(o.clientId ?? "") ? `${clientName.get(o.clientId ?? "")}: ` : ""}{o.title}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-page">Kalender</h1>
          <p className="text-sm text-anthracite/60">Geplante Lieferungen und Veröffentlichungen aller Kunden.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={query(shift(monat, -1))} className="btn-secondary px-2.5" aria-label="Vormonat">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[150px] text-center font-serif text-lg font-semibold">{monatLabel(monat)}</span>
          <Link href={query(shift(monat, 1))} className="btn-secondary px-2.5" aria-label="Nächster Monat">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href={query(currentMonth())} className="btn-ghost btn-sm">
            Heute
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href={`/kalender?monat=${monat}`} className={`chip ${!sp.kunde ? "border-terracotta text-terracotta-dark" : ""}`}>
          Alle Kunden
        </Link>
        {clients.map((c) => (
          <Link key={c.id} href={`/kalender?monat=${monat}&kunde=${c.id}`} className={`chip ${sp.kunde === c.id ? "border-terracotta text-terracotta-dark" : ""}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {/* Monatsraster ab Tablet */}
      <div className="card hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-cream-darker bg-cream-dark/50 text-center text-xs font-semibold uppercase tracking-wide text-anthracite/55">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div key={i} className={`min-h-[118px] border-b border-r border-cream-dark p-1.5 ${day ? "" : "bg-cream/40"}`}>
              {day && (
                <>
                  <div className={`mb-1 text-xs font-semibold ${day === heute ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white" : "text-anthracite/50"}`}>
                    {Number(day.slice(8))}
                  </div>
                  <div className="space-y-1">{(byDay.get(day) ?? []).map(entry)}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Liste auf dem Handy */}
      <div className="space-y-3 md:hidden">
        {[...byDay.keys()].sort().map((day) => (
          <div key={day} className="card p-3">
            <div className="mb-2 text-sm font-semibold">{formatDate(day, { weekday: "long", day: "numeric", month: "long" })}</div>
            <div className="space-y-1">{byDay.get(day)!.map(entry)}</div>
          </div>
        ))}
        {byDay.size === 0 && <p className="text-sm text-anthracite/55">In diesem Monat ist nichts geplant.</p>}
      </div>

      {ohneTermin.length > 0 && (
        <div className="card p-4">
          <h2 className="h-section mb-2">In Arbeit ohne Termin ({ohneTermin.length})</h2>
          <div className="flex flex-wrap gap-1.5">{ohneTermin.slice(0, 30).map(entry)}</div>
        </div>
      )}
    </div>
  );
}
