import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FileText, Plus, Receipt, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { expenses, invoices, quotes, type Customer } from "@/lib/db/schema";
import { Card, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { customerProfitability } from "@/lib/domain/finance";
import { EXPENSE_CATEGORY_MAP, INVOICE_STATUS_MAP, QUOTE_STATUS_MAP } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { eur, fmtDate, fmtRate } from "@/lib/format";

export async function FinanceTab({ customer }: { customer: Customer }) {
  const id = customer.id;
  const today = todayISO();
  const [invoiceRows, quoteRows, expenseRows, profitAll] = await Promise.all([
    db.select().from(invoices).where(eq(invoices.customerId, id)).orderBy(desc(invoices.issueDate), desc(invoices.id)),
    db.select().from(quotes).where(eq(quotes.customerId, id)).orderBy(desc(quotes.issueDate)),
    db.select().from(expenses).where(eq(expenses.customerId, id)).orderBy(desc(expenses.date)),
    customerProfitability("2000-01-01", "2999-12-31"),
  ]);
  const p = profitAll.find((x) => x.id === id);
  const yearProfit = (await customerProfitability(`${today.slice(0, 4)}-01-01`, `${today.slice(0, 4)}-12-31`)).find((x) => x.id === id);
  const open = invoiceRows.filter((i) => i.status === "offen" || i.status === "teilbezahlt").reduce((s, i) => s + i.grossTotal - i.paidTotal, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Umsatz ${today.slice(0, 4)} (netto)`} value={eur(yearProfit?.umsatz ?? 0)} icon={<Receipt />} />
        <Stat label="Umsatz gesamt (netto)" value={eur(p?.umsatz ?? 0)} hint={customer.startDate ? `seit ${fmtDate(customer.startDate)}` : undefined} />
        <Stat label="Deckungsbeitrag gesamt" value={eur(p?.deckungsbeitrag ?? 0)} hint={p?.marge != null ? `Marge ${fmtRate(p.marge, 0)}` : undefined} icon={<Wallet />} />
        <Stat label="Offene Posten" value={eur(open)} className={open ? "ring-1 ring-amber-500/30" : ""} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Rechnungen" icon={<Receipt />} actions={<LinkButton href={`/rechnungen/neu?kunde=${id}`} size="sm" variant="primary"><Plus /> Rechnung</LinkButton>} />
        {invoiceRows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">Noch keine Rechnungen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Nummer</th><th>Betreff</th><th>Datum</th><th>Fällig</th><th className="text-right">Betrag</th><th>Status</th></tr></thead>
              <tbody>
                {invoiceRows.map((i) => (
                  <tr key={i.id} className="row-link relative">
                    <td className="font-medium"><Link href={`/rechnungen/${i.id}`} className="after:absolute after:inset-0">{i.number ?? "Entwurf"}</Link></td>
                    <td className="max-w-72 truncate text-fg-2">{i.title}</td>
                    <td>{fmtDate(i.issueDate)}</td>
                    <td className={(i.status === "offen" || i.status === "teilbezahlt") && i.dueDate && i.dueDate < today ? "font-medium text-red-600" : ""}>{fmtDate(i.dueDate)}</td>
                    <td className="text-right font-medium num">{eur(i.grossTotal)}</td>
                    <td><div className="flex gap-1"><StatusBadge value={i.status} map={INVOICE_STATUS_MAP} />{i.kind === "storno" && <Badge tone="red">Storno</Badge>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Angebote" icon={<FileText />} actions={<LinkButton href={`/angebote/neu?kunde=${id}`} size="sm"><Plus /> Angebot</LinkButton>} />
          {quoteRows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Noch keine Angebote.</p>
          ) : (
            <div className="divide-y divide-line">
              {quoteRows.map((q) => (
                <Link key={q.id} href={`/angebote/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{q.number} · {q.title}</p>
                    <p className="text-xs text-muted">{fmtDate(q.issueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num">{eur(q.netTotal)}</span>
                    <StatusBadge value={q.status} map={QUOTE_STATUS_MAP} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Zugeordnete Kosten" description="Freelancer, Fahrten, Material … für diesen Kunden" icon={<Wallet />} actions={<LinkButton href={`/ausgaben?neu=1&kunde=${id}`} size="sm"><Plus /> Ausgabe</LinkButton>} />
          {expenseRows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Keine kundenbezogenen Ausgaben.</p>
          ) : (
            <div className="divide-y divide-line">
              {expenseRows.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.vendor}{e.description ? ` · ${e.description}` : ""}</p>
                    <p className="text-xs text-muted">{fmtDate(e.date)} · {EXPENSE_CATEGORY_MAP[e.category]?.label ?? e.category}</p>
                  </div>
                  <span className="num">{eur(e.netAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
