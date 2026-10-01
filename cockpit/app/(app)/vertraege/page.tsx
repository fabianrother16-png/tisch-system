import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { AlarmClock, FileSignature, Repeat, TrendingUp, Users } from "lucide-react";
import { db } from "@/lib/db";
import { contracts, customers } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Tabs";
import { contractTerm, monthlyValue, noticeLabel } from "@/lib/domain/contracts";
import { CONTRACT_STATUS_MAP } from "@/lib/constants";
import { diffDays, todayISO } from "@/lib/dates";
import { eur, fmtDate, relativeDays } from "@/lib/format";

export const metadata = { title: "Verträge" };

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ ansicht?: string }> }) {
  await requireUser();
  const { ansicht = "laufend" } = await searchParams;
  const today = todayISO();
  const statuses = ansicht === "alle" ? (["entwurf", "aktiv", "gekuendigt", "beendet"] as const) : (["aktiv", "gekuendigt"] as const);
  const rows = await db
    .select({ contract: contracts, customer: customers })
    .from(contracts)
    .innerJoin(customers, eq(customers.id, contracts.customerId))
    .where(inArray(contracts.status, [...statuses]));

  const enriched = rows
    .map((r) => ({ ...r, term: contractTerm(r.contract, today) }))
    .sort((a, b) => (a.term.noticeDeadline ?? a.term.termEnd ?? "9999").localeCompare(b.term.noticeDeadline ?? b.term.termEnd ?? "9999"));

  const active = enriched.filter((r) => r.contract.status === "aktiv");
  const mrr = active.reduce((s, r) => s + monthlyValue(r.contract), 0);
  const deadlines = active.filter((r) => r.term.daysToNotice != null && r.term.daysToNotice >= 0 && r.term.daysToNotice <= 60);
  const ending = enriched.filter((r) => r.contract.status === "gekuendigt");
  const customersWithContract = new Set(active.map((r) => r.customer.id)).size;

  return (
    <>
      <PageHeader
        title="Verträge"
        description="Alle Kundenverträge mit Laufzeiten, Kündigungsfristen und Konditionen. Neue Verträge legt ihr direkt beim Kunden an."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Monatlich wiederkehrend (MRR)" value={eur(mrr)} hint={`${eur(mrr * 12)} pro Jahr`} icon={<TrendingUp />} />
        <Stat label="Aktive Verträge" value={active.length} hint={`${customersWithContract} Kunden`} icon={<Users />} />
        <Stat label="Kündigungsfrist in 60 Tagen" value={deadlines.length} hint="Verlängerung ansprechen" icon={<AlarmClock />} />
        <Stat label="Gekündigt, laufen aus" value={ending.length} icon={<Repeat />} />
      </div>
      <div className="mb-4">
        <Segmented
          active={ansicht}
          items={[
            { key: "laufend", label: "Laufend", href: "/vertraege" },
            { key: "alle", label: "Alle inkl. beendet", href: "/vertraege?ansicht=alle" },
          ]}
        />
      </div>
      <Card className="overflow-hidden">
        {enriched.length === 0 ? (
          <EmptyState icon={<FileSignature />} title="Keine Verträge" description="Öffnet einen Kunden und legt im Tab „Verträge“ den ersten Vertrag an." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kunde / Paket</th>
                  <th>Status</th>
                  <th className="text-right">Monatlich</th>
                  <th>Umfang</th>
                  <th>Laufzeit bis</th>
                  <th>Kündbar bis</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(({ contract: c, customer, term }) => {
                  const urgent = term.daysToNotice != null && term.daysToNotice >= 0 && term.daysToNotice <= 30;
                  return (
                    <tr key={c.id} className="row-link relative">
                      <td>
                        <Link href={`/kunden/${customer.id}?tab=vertraege`} className="flex items-center gap-3 after:absolute after:inset-0">
                          <CustomerMark name={customer.name} color={customer.color} size="sm" />
                          <span>
                            <span className="block font-medium">{customer.name}</span>
                            <span className="block text-xs text-muted">{c.title}</span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <StatusBadge value={c.status} map={CONTRACT_STATUS_MAP} />
                          {c.autoInvoice && <Badge tone="blue">Serie</Badge>}
                        </div>
                      </td>
                      <td className="text-right font-medium num">{eur(c.monthlyFee)}</td>
                      <td className="text-xs text-muted">
                        {[c.videosPerMonth && `${c.videosPerMonth} Videos`, c.postsPerMonth && `${c.postsPerMonth} Posts`, c.visitsPerMonth && `${c.visitsPerMonth}× vor Ort`]
                          .filter(Boolean)
                          .join(" · ") || "–"}
                      </td>
                      <td>{term.termEnd ? fmtDate(term.termEnd) : <span className="text-muted">unbefristet</span>}</td>
                      <td>
                        {term.noticeDeadline ? (
                          <span className={urgent ? "font-semibold text-amber-700 dark:text-amber-300" : ""}>
                            {fmtDate(term.noticeDeadline)}
                            <span className="block text-xs font-normal text-muted">{relativeDays(diffDays(term.noticeDeadline, today))}</span>
                          </span>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                      <td className="text-muted">{noticeLabel(c)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
