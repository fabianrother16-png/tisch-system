import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { CalendarCheck2, Clapperboard, Eye, MousePointerClick } from "lucide-react";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { buildPerformanceData } from "@/lib/domain/report";
import { RANGE_OPTIONS } from "@/lib/domain/performance";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { LogoMark } from "@/components/shell/Logo";
import { PrintButton } from "@/components/ui/PrintButton";
import { Segmented } from "@/components/ui/Tabs";
import { CustomerMark } from "@/components/ui/Avatar";
import { fmtCompact, fmtDate, fmtDateLong, fmtNumber } from "@/lib/format";
import { todayISO } from "@/lib/dates";

export const metadata = { title: "Marketing-Report", robots: { index: false, follow: false } };

export default async function ReportPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ zeitraum?: string; vorschau?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const [customer] = await db.select().from(customers).where(eq(customers.reportToken, token)).limit(1);
  if (!customer) notFound();
  const preview = sp.vorschau === "1" && !!(await getCurrentUser());
  if (!customer.reportEnabled && !preview) notFound();

  const [data, company] = await Promise.all([buildPerformanceData(customer.id, sp.zeitraum ?? "90"), getSetting("company")]);
  const today = todayISO();
  const href = (k: string) => `/report/${token}?zeitraum=${k}${preview ? "&vorschau=1" : ""}`;

  return (
    <div className="min-h-dvh bg-bg">
      {preview && (
        <div className="no-print bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">Vorschau – der Link ist für den Kunden noch nicht freigegeben.</div>
      )}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-auto text-accent" />
            <div>
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase">{company.name}</p>
              <p className="mt-0.5 font-serif text-[15px] text-muted italic">{company.claim || "Marketing-Report"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="no-print">
              <Segmented active={data.range.key} items={RANGE_OPTIONS.map((o) => ({ key: o.key, label: o.label, href: href(o.key) }))} />
            </div>
            <PrintButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <CustomerMark name={customer.name} color={customer.color} size="lg" />
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Marketing-Report</p>
              <h1 className="font-serif text-[40px] leading-tight font-semibold">{customer.name}</h1>
              <p className="mt-1 text-sm text-muted">
                Zeitraum {fmtDate(data.range.from)} – {fmtDate(data.range.to)}
                {customer.startDate && <> · Zusammenarbeit seit {fmtDateLong(customer.startDate)}</>}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">Stand: {fmtDateLong(today)}</p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Das haben wir für Sie umgesetzt</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: <Clapperboard />, label: "Veröffentlichte Beiträge", value: fmtNumber(Math.max(data.work.published, data.work.posts)) },
              { icon: <CalendarCheck2 />, label: "Drehs & Termine vor Ort", value: fmtNumber(data.work.visits) },
              { icon: <Eye />, label: "Aufrufe Ihrer Beiträge", value: fmtCompact(data.totals.views) },
              { icon: <MousePointerClick />, label: "Klicks über Links & NFC", value: fmtNumber(data.linkTotal) },
            ].map((t) => (
              <div key={t.label} className="card p-5">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent [&_svg]:size-4">{t.icon}</div>
                <p className="text-3xl font-semibold tracking-tight">{t.value}</p>
                <p className="mt-1 text-sm text-muted">{t.label}</p>
              </div>
            ))}
          </div>
        </section>

        <PerformanceDashboard data={data} today={today} audience="kunde" />

        <footer className="border-t border-line pt-6 text-center text-sm text-muted">
          <p>
            Fragen zu Ihren Zahlen? Wir sind für Sie da{company.phone ? `: ${company.phone}` : ""}
            {company.email ? (
              <>
                {" · "}
                <Link className="text-accent hover:underline" href={`mailto:${company.email}`}>{company.email}</Link>
              </>
            ) : null}
          </p>
          <p className="mt-4 font-serif text-2xl text-fg italic">{company.claim || company.name}</p>
          <p className="mt-1 text-xs">Erstellt von {company.name} · Alle Zahlen stammen direkt von den Plattformen bzw. aus unserer Auswertung.</p>
        </footer>
      </main>
    </div>
  );
}
