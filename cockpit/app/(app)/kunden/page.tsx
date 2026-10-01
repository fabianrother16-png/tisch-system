import Link from "next/link";
import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { Plus, Search, Users } from "lucide-react";
import { db } from "@/lib/db";
import { contracts, customers, invoices, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar, CustomerMark } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Tabs";
import { CUSTOMER_STATUS, CUSTOMER_STATUS_MAP } from "@/lib/constants";
import { eur, fmtDate } from "@/lib/format";
import { currentMonth } from "@/lib/dates";
import { getMonthlyQuota } from "@/lib/domain/quota";

export const metadata = { title: "Kunden" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireUser();
  const { status = "aktiv", q } = await searchParams;
  const term = q?.trim();

  const rows = await db
    .select({ customer: customers, owner: users })
    .from(customers)
    .leftJoin(users, eq(users.id, customers.ownerId))
    .where(
      and(
        status !== "alle" ? eq(customers.status, status as "aktiv") : undefined,
        term
          ? or(
              like(customers.name, `%${term}%`),
              like(customers.city, `%${term}%`),
              like(customers.industry, `%${term}%`),
              like(customers.number, `%${term}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(customers.name));

  const ids = rows.map((r) => r.customer.id);
  const [contractRows, openRows, quota, statusCounts] = await Promise.all([
    ids.length
      ? db.select().from(contracts).where(and(inArray(contracts.customerId, ids), eq(contracts.status, "aktiv")))
      : [],
    ids.length
      ? db
          .select({ customerId: invoices.customerId, open: sql<number>`sum(${invoices.grossTotal} - ${invoices.paidTotal})` })
          .from(invoices)
          .where(and(inArray(invoices.customerId, ids), inArray(invoices.status, ["offen", "teilbezahlt"])))
          .groupBy(invoices.customerId)
      : [],
    getMonthlyQuota(currentMonth()),
    db.select({ status: customers.status, n: sql<number>`count(*)` }).from(customers).groupBy(customers.status),
  ]);

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s.n]));
  const total = statusCounts.reduce((s, x) => s + x.n, 0);
  const quotaMap = new Map(quota.map((q) => [q.customerId, q]));
  const openMap = new Map(openRows.map((o) => [o.customerId, o.open]));
  const contractMap = new Map<number, { title: string; mrr: number }>();
  for (const c of contractRows) {
    const prev = contractMap.get(c.customerId);
    contractMap.set(c.customerId, { title: prev ? `${prev.title}, ${c.title}` : c.title, mrr: (prev?.mrr ?? 0) + c.monthlyFee });
  }

  const href = (s: string) => `/kunden?status=${s}${term ? `&q=${encodeURIComponent(term)}` : ""}`;

  return (
    <>
      <PageHeader
        title="Kunden"
        description="Euer Kundenkatalog – klick auf einen Kunden für alle Details, Zahlen und Dokumente."
        actions={
          <LinkButton href="/kunden/neu" variant="primary">
            <Plus /> Neuer Kunde
          </LinkButton>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          active={status}
          items={[
            ...CUSTOMER_STATUS.map((s) => ({ key: s.value, label: `${s.label} ${counts[s.value] ?? 0}`, href: href(s.value) })),
            { key: "alle", label: `Alle ${total}`, href: href("alle") },
          ]}
        />
        <form className="relative w-full sm:w-72">
          <input type="hidden" name="status" value={status} />
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={term} placeholder="Name, Ort, Branche …" className="input pl-9" />
        </form>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={term ? "Keine Treffer" : "Noch keine Kunden in dieser Ansicht"}
            description="Lege euren ersten Kunden an – danach könnt ihr Verträge, Content und Zahlen zuordnen."
            action={
              <LinkButton href="/kunden/neu" variant="primary">
                <Plus /> Kunde anlegen
              </LinkButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th>Status</th>
                  <th>Vertrag</th>
                  <th className="text-right">Monatlich</th>
                  <th className="min-w-44">Content {new Date().toLocaleString("de-DE", { month: "long" })}</th>
                  <th className="text-right">Offene Posten</th>
                  <th>Betreuung</th>
                  <th>Kunde seit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ customer: c, owner }) => {
                  const contract = contractMap.get(c.id);
                  const qrow = quotaMap.get(c.id);
                  const open = openMap.get(c.id) ?? 0;
                  return (
                    <tr key={c.id} className="row-link relative">
                      <td>
                        <Link href={`/kunden/${c.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                          <CustomerMark name={c.name} color={c.color} />
                          <span className="min-w-0">
                            <span className="block font-medium text-fg">{c.name}</span>
                            <span className="block text-xs text-muted">
                              {[c.industry, c.city].filter(Boolean).join(" · ") || c.number}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <StatusBadge value={c.status} map={CUSTOMER_STATUS_MAP} />
                      </td>
                      <td className="max-w-48 truncate text-fg-2">{contract?.title ?? <span className="text-muted">–</span>}</td>
                      <td className="text-right num">{contract ? eur(contract.mrr) : "–"}</td>
                      <td>
                        {qrow && qrow.videos.target > 0 ? (
                          <div className="space-y-1">
                            <Progress
                              total={qrow.videos.target}
                              segments={[
                                { value: qrow.videos.delivered, className: "bg-emerald-500" },
                                { value: qrow.videos.inProgress, className: "bg-amber-400" },
                              ]}
                            />
                            <p className="text-xs text-muted num">
                              {qrow.videos.delivered}/{qrow.videos.target} Videos
                              {qrow.videos.missing > 0 && <span className="text-red-600 dark:text-red-400"> · {qrow.videos.missing} offen</span>}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">kein Video-Soll</span>
                        )}
                      </td>
                      <td className={`text-right num ${open > 0 ? "font-medium" : "text-muted"}`}>{open > 0 ? eur(open) : "–"}</td>
                      <td>{owner ? <Avatar name={owner.name} color={owner.color} size="sm" /> : <span className="text-muted">–</span>}</td>
                      <td className="text-muted">{fmtDate(c.startDate)}</td>
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
