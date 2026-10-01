import Link from "next/link";
import { and, desc, eq, inArray, lt, sql, gte } from "drizzle-orm";
import { AlarmClock, CircleDollarSign, FilePen, Plus, Receipt, Repeat, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { customers, invoices, payments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Tabs";
import { ActionButton } from "@/components/ui/form";
import { runRecurringInvoices } from "@/lib/actions/invoices";
import { INVOICE_STATUS_MAP } from "@/lib/constants";
import { diffDays, startOfMonth, todayISO } from "@/lib/dates";
import { eur, fmtDate } from "@/lib/format";

export const metadata = { title: "Rechnungen" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ filter?: string; jahr?: string }> }) {
  await requireUser();
  const { filter = "offen", jahr } = await searchParams;
  const today = todayISO();
  const year = jahr && /^\d{4}$/.test(jahr) ? jahr : null;

  const where = and(
    filter === "offen" ? inArray(invoices.status, ["offen", "teilbezahlt"]) : undefined,
    filter === "ueberfaellig" ? and(inArray(invoices.status, ["offen", "teilbezahlt"]), lt(invoices.dueDate, today)) : undefined,
    filter === "entwurf" ? eq(invoices.status, "entwurf") : undefined,
    filter === "bezahlt" ? eq(invoices.status, "bezahlt") : undefined,
    filter === "storniert" ? eq(invoices.status, "storniert") : undefined,
    year ? sql`substr(${invoices.issueDate}, 1, 4) = ${year}` : undefined,
  );

  const [rows, [openSum], [overdueSum], [paidMonth], [drafts]] = await Promise.all([
    db
      .select({ invoice: invoices, customer: customers })
      .from(invoices)
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(where)
      .orderBy(desc(invoices.issueDate), desc(invoices.id))
      .limit(500),
    db.select({ v: sql<number>`coalesce(sum(${invoices.grossTotal} - ${invoices.paidTotal}),0)`, n: sql<number>`count(*)` }).from(invoices).where(inArray(invoices.status, ["offen", "teilbezahlt"])),
    db
      .select({ v: sql<number>`coalesce(sum(${invoices.grossTotal} - ${invoices.paidTotal}),0)`, n: sql<number>`count(*)` })
      .from(invoices)
      .where(and(inArray(invoices.status, ["offen", "teilbezahlt"]), lt(invoices.dueDate, today))),
    db.select({ v: sql<number>`coalesce(sum(${payments.amount}),0)` }).from(payments).where(gte(payments.date, startOfMonth(today))),
    db.select({ n: sql<number>`count(*)` }).from(invoices).where(eq(invoices.status, "entwurf")),
  ]);

  const tab = (key: string, label: string) => ({ key, label, href: `/rechnungen?filter=${key}${year ? `&jahr=${year}` : ""}` });

  return (
    <>
      <PageHeader
        title="Rechnungen"
        description="Rechnungen schreiben, versenden, Zahlungseingänge erfassen – mit fortlaufender Nummer und PDF-Archiv."
        actions={
          <>
            <ActionButton action={runRecurringInvoices} variant="secondary" size="md" title="Fällige Serienrechnungen aus Verträgen vorbereiten">
              <Repeat /> Serienrechnungen
            </ActionButton>
            <LinkButton href="/rechnungen/neu" variant="primary">
              <Plus /> Neue Rechnung
            </LinkButton>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Offene Forderungen" value={eur(openSum.v)} hint={`${openSum.n} Rechnungen`} icon={<Wallet />} />
        <Stat label="Davon überfällig" value={eur(overdueSum.v)} hint={`${overdueSum.n} Rechnungen`} icon={<AlarmClock />} className={overdueSum.n ? "ring-1 ring-red-500/30" : ""} />
        <Stat label="Eingänge diesen Monat" value={eur(paidMonth.v)} icon={<CircleDollarSign />} />
        <Stat label="Entwürfe" value={drafts.n} hint="noch nicht versendet" icon={<FilePen />} />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          active={filter}
          items={[tab("offen", "Offen"), tab("ueberfaellig", "Überfällig"), tab("entwurf", "Entwürfe"), tab("bezahlt", "Bezahlt"), tab("storniert", "Storniert"), tab("alle", "Alle")]}
        />
        <form className="flex items-center gap-2">
          <input type="hidden" name="filter" value={filter} />
          <select name="jahr" defaultValue={year ?? ""} className="input w-auto py-1.5 text-sm" aria-label="Jahr">
            <option value="">Alle Jahre</option>
            {Array.from({ length: 5 }, (_, i) => String(Number(today.slice(0, 4)) - i)).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="text-sm font-medium text-accent">Anwenden</button>
        </form>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="Keine Rechnungen in dieser Ansicht"
            action={<LinkButton href="/rechnungen/neu" variant="primary"><Plus /> Rechnung schreiben</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nummer</th>
                  <th>Kunde</th>
                  <th>Betreff</th>
                  <th>Datum</th>
                  <th>Fällig</th>
                  <th className="text-right">Betrag</th>
                  <th className="text-right">Offen</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ invoice: i, customer: c }) => {
                  const overdue = ["offen", "teilbezahlt"].includes(i.status) && i.dueDate && i.dueDate < today;
                  return (
                    <tr key={i.id} className="row-link relative">
                      <td className="font-medium whitespace-nowrap">
                        <Link href={`/rechnungen/${i.id}`} className="after:absolute after:inset-0">
                          {i.number ?? <span className="text-muted italic">Entwurf</span>}
                        </Link>
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <CustomerMark name={c.name} color={c.color} size="sm" />
                          <span className="max-w-40 truncate">{c.name}</span>
                        </span>
                      </td>
                      <td className="max-w-64 truncate text-fg-2">{i.title}</td>
                      <td className="whitespace-nowrap">{fmtDate(i.issueDate)}</td>
                      <td className={`whitespace-nowrap ${overdue ? "font-medium text-red-600 dark:text-red-400" : ""}`}>
                        {fmtDate(i.dueDate)}
                        {overdue && <span className="block text-xs">{diffDays(today, i.dueDate!)} Tage über</span>}
                      </td>
                      <td className="text-right font-medium whitespace-nowrap num">{eur(i.grossTotal)}</td>
                      <td className="text-right whitespace-nowrap num">{["offen", "teilbezahlt"].includes(i.status) ? eur(i.grossTotal - i.paidTotal) : "–"}</td>
                      <td>
                        <div className="flex gap-1">
                          <StatusBadge value={i.status} map={INVOICE_STATUS_MAP} />
                          {i.kind === "storno" && <Badge tone="red">Storno</Badge>}
                          {overdue && <Badge tone="red">überfällig</Badge>}
                          {i.reminderLevel > 0 && <Badge tone="amber">{i.reminderLevel}. Mahnung</Badge>}
                          {i.contractId && i.status === "entwurf" && <Badge tone="blue">Serie</Badge>}
                        </div>
                      </td>
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
