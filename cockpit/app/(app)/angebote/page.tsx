import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { FileText, Hourglass, Percent, Plus, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { customers, quotes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Tabs";
import { QUOTE_STATUS_MAP } from "@/lib/constants";
import { diffDays, todayISO } from "@/lib/dates";
import { eur, fmtDate, fmtRate } from "@/lib/format";

export const metadata = { title: "Angebote" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireUser();
  const { filter = "offen" } = await searchParams;
  const today = todayISO();
  const year = today.slice(0, 4);
  const [rows, stats] = await Promise.all([
    db
      .select({ quote: quotes, customer: customers })
      .from(quotes)
      .innerJoin(customers, eq(customers.id, quotes.customerId))
      .where(
        filter === "offen"
          ? inArray(quotes.status, ["entwurf", "versendet"])
          : filter === "alle"
            ? undefined
            : eq(quotes.status, filter as "angenommen"),
      )
      .orderBy(desc(quotes.issueDate), desc(quotes.id)),
    db
      .select({ status: quotes.status, n: sql<number>`count(*)`, v: sql<number>`sum(${quotes.netTotal})` })
      .from(quotes)
      .where(and(sql`substr(${quotes.issueDate}, 1, 4) = ${year}`))
      .groupBy(quotes.status),
  ]);
  const by = (s: string) => stats.find((x) => x.status === s) ?? { n: 0, v: 0 };
  const decided = by("angenommen").n + by("abgelehnt").n;
  const winRate = decided ? (by("angenommen").n / decided) * 100 : null;
  const pending = by("versendet");

  return (
    <>
      <PageHeader
        title="Angebote"
        description="Angebote erstellen, versenden und mit einem Klick in Rechnung oder Vertrag umwandeln."
        actions={<LinkButton href="/angebote/neu" variant="primary"><Plus /> Neues Angebot</LinkButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Warten auf Antwort" value={pending.n} hint={`${eur(pending.v ?? 0)} netto`} icon={<Hourglass />} />
        <Stat label={`Angenommen ${year}`} value={by("angenommen").n} hint={`${eur(by("angenommen").v ?? 0)} netto`} icon={<Trophy />} />
        <Stat label="Abschlussquote" value={fmtRate(winRate, 0)} hint={`${decided} entschieden`} icon={<Percent />} />
        <Stat label={`Angebote ${year}`} value={stats.reduce((s, x) => s + x.n, 0)} icon={<FileText />} />
      </div>
      <div className="mb-4">
        <Segmented
          active={filter}
          items={[
            { key: "offen", label: "Offen", href: "/angebote" },
            { key: "angenommen", label: "Angenommen", href: "/angebote?filter=angenommen" },
            { key: "abgelehnt", label: "Abgelehnt", href: "/angebote?filter=abgelehnt" },
            { key: "abgelaufen", label: "Abgelaufen", href: "/angebote?filter=abgelaufen" },
            { key: "alle", label: "Alle", href: "/angebote?filter=alle" },
          ]}
        />
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<FileText />} title="Keine Angebote in dieser Ansicht" action={<LinkButton href="/angebote/neu" variant="primary"><Plus /> Angebot erstellen</LinkButton>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nummer</th>
                  <th>Kunde</th>
                  <th>Betreff</th>
                  <th>Datum</th>
                  <th>Gültig bis</th>
                  <th className="text-right">Netto</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ quote: q, customer: c }) => {
                  const expiring = q.status === "versendet" && q.validUntil && diffDays(q.validUntil, today) <= 5;
                  return (
                    <tr key={q.id} className="row-link relative">
                      <td className="font-medium whitespace-nowrap">
                        <Link href={`/angebote/${q.id}`} className="after:absolute after:inset-0">{q.number}</Link>
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <CustomerMark name={c.name} color={c.color} size="sm" />
                          <span className="max-w-40 truncate">{c.name}</span>
                        </span>
                      </td>
                      <td className="max-w-64 truncate text-fg-2">{q.title}</td>
                      <td className="whitespace-nowrap">{fmtDate(q.issueDate)}</td>
                      <td className={`whitespace-nowrap ${expiring ? "font-medium text-amber-700 dark:text-amber-300" : ""}`}>{fmtDate(q.validUntil)}</td>
                      <td className="text-right font-medium whitespace-nowrap num">{eur(q.netTotal)}</td>
                      <td>
                        <div className="flex gap-1">
                          <StatusBadge value={q.status} map={QUOTE_STATUS_MAP} />
                          {q.invoiceId && <Badge tone="green">berechnet</Badge>}
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
