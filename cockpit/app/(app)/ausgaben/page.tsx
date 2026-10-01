import Link from "next/link";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { ChevronLeft, ChevronRight, HandCoins, Paperclip, PiggyBank, Plus, Receipt, Repeat, Pencil, Trash2, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { customers, expenses, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Tabs";
import { ActionButton } from "@/components/ui/form";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { bookRecurring, deleteExpense, markReimbursed, saveExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORY_MAP } from "@/lib/constants";
import { addMonthKey, currentMonth, endOfMonth, todayISO } from "@/lib/dates";
import { eur, fmtDate, fmtMonth } from "@/lib/format";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Ausgaben" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ monat?: string; zeitraum?: string; neu?: string; kunde?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.monat ?? "") ? sp.monat! : currentMonth();
  const scope = sp.zeitraum === "jahr" ? "jahr" : "monat";
  const from = scope === "jahr" ? `${month.slice(0, 4)}-01-01` : `${month}-01`;
  const to = scope === "jahr" ? `${month.slice(0, 4)}-12-31` : endOfMonth(`${month}-01`);

  const [rows, customerRows, team, invoicing, recurringRows, openAdvances] = await Promise.all([
    db
      .select({ expense: expenses, customer: customers })
      .from(expenses)
      .leftJoin(customers, eq(customers.id, expenses.customerId))
      .where(and(gte(expenses.date, from), lte(expenses.date, to)))
      .orderBy(desc(expenses.date), desc(expenses.id)),
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true)),
    getSetting("invoicing"),
    db.select().from(expenses).where(inArray(expenses.recurring, ["monatlich", "jaehrlich"])),
    db.select().from(expenses).where(and(eq(expenses.paymentMethod, "privat_auslage"), eq(expenses.reimbursed, false))),
  ]);

  const totalNet = rows.reduce((s, r) => s + r.expense.netAmount, 0);
  const totalTax = rows.reduce((s, r) => s + r.expense.taxAmount, 0);
  const missingReceipts = rows.filter((r) => !r.expense.receiptFileId).length;

  // Fixkosten: je wiederkehrender Vorlage die jüngste Buchung
  const latest = new Map<string, (typeof recurringRows)[number]>();
  for (const t of recurringRows) {
    const key = `${t.vendor}|${t.description ?? ""}|${t.recurring}`;
    const prev = latest.get(key);
    if (!prev || prev.date < t.date) latest.set(key, t);
  }
  const fixedMonthly = [...latest.values()].reduce((s, t) => s + (t.recurring === "monatlich" ? t.netAmount : Math.round(t.netAmount / 12)), 0);

  const byCategory = new Map<string, number>();
  for (const r of rows) byCategory.set(r.expense.category, (byCategory.get(r.expense.category) ?? 0) + r.expense.netAmount);
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = categories[0]?.[1] ?? 1;

  const advancesByUser = new Map<number, number>();
  for (const a of openAdvances) if (a.paidByUserId) advancesByUser.set(a.paidByUserId, (advancesByUser.get(a.paidByUserId) ?? 0) + a.grossAmount);
  const userName = (id: number | null) => team.find((u) => u.id === id)?.name ?? "–";

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ monat: month, zeitraum: scope === "jahr" ? "jahr" : undefined, ...patch })) if (v) p.set(k, v);
    return `/ausgaben?${p}`;
  };
  const step = scope === "jahr" ? 12 : 1;
  const formProps = { customers: customerRows, users: team, today: todayISO(), kleinunternehmer: invoicing.kleinunternehmer };

  return (
    <>
      <PageHeader
        title="Ausgaben & Belege"
        description="Kosten erfassen, Belege abfotografieren, Abos und Auslagen im Blick behalten."
        actions={
          <>
            <ActionButton action={bookRecurring.bind(null, month)} variant="secondary" size="md" title={`Wiederkehrende Ausgaben für ${fmtMonth(month)} anlegen`}>
              <Repeat /> Abos für {fmtMonth(month).split(" ")[0]} buchen
            </ActionButton>
            <Modal title="Ausgabe erfassen" size="lg" defaultOpen={sp.neu === "1"} trigger={<Button><Plus /> Ausgabe</Button>}>
              <ExpenseForm action={saveExpense.bind(null, null)} {...formProps} defaultCustomerId={sp.kunde ? Number(sp.kunde) : undefined} />
            </Modal>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LinkButton href={qs({ monat: addMonthKey(month, -step) })} size="icon" aria-label="Zurück"><ChevronLeft /></LinkButton>
          <span className="min-w-36 text-center font-semibold">{scope === "jahr" ? month.slice(0, 4) : fmtMonth(month)}</span>
          <LinkButton href={qs({ monat: addMonthKey(month, step) })} size="icon" aria-label="Weiter"><ChevronRight /></LinkButton>
        </div>
        <Segmented active={scope} items={[{ key: "monat", label: "Monat", href: qs({ zeitraum: undefined }) }, { key: "jahr", label: "Jahr", href: qs({ zeitraum: "jahr" }) }]} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ausgaben (netto)" value={eur(totalNet)} hint={`${rows.length} Buchungen`} icon={<Wallet />} />
        <Stat label="Vorsteuer" value={eur(totalTax)} hint="holt ihr vom Finanzamt zurück" icon={<PiggyBank />} />
        <Stat label="Fixkosten pro Monat" value={eur(fixedMonthly)} hint={`${latest.size} Abos & Verträge`} icon={<Repeat />} />
        <Stat label="Fehlende Belege" value={missingReceipts} hint="im gewählten Zeitraum" icon={<Paperclip />} className={missingReceipts ? "ring-1 ring-amber-500/30" : ""} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState icon={<Receipt />} title="Keine Ausgaben in diesem Zeitraum" description="Erfasst Ausgaben direkt mit Foto vom Beleg – dann ist die Buchhaltung am Jahresende in Minuten erledigt." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Empfänger</th>
                    <th>Kategorie</th>
                    <th>Kunde</th>
                    <th className="text-right">Netto</th>
                    <th className="text-right">Brutto</th>
                    <th>Beleg</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ expense: e, customer: c }) => (
                    <tr key={e.id} className="group">
                      <td className="whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td>
                        <p className="font-medium">{e.vendor}</p>
                        <p className="text-xs text-muted">
                          {e.description}
                          {e.recurring !== "nein" && <Badge className="ml-1">{e.recurring}</Badge>}
                          {e.paymentMethod === "privat_auslage" && (
                            <Badge tone={e.reimbursed ? "neutral" : "amber"} className="ml-1">
                              Auslage {userName(e.paidByUserId)}{e.reimbursed ? " ✓" : ""}
                            </Badge>
                          )}
                        </p>
                      </td>
                      <td className="text-fg-2">{EXPENSE_CATEGORY_MAP[e.category]?.label ?? e.category}</td>
                      <td>{c ? <Link href={`/kunden/${c.id}?tab=finanzen`} className="hover:text-accent">{c.name}</Link> : <span className="text-muted">–</span>}</td>
                      <td className="text-right whitespace-nowrap num">{eur(e.netAmount)}</td>
                      <td className="text-right whitespace-nowrap text-muted num">{eur(e.grossAmount)}</td>
                      <td>
                        {e.receiptFileId ? (
                          <a href={`/api/files/${e.receiptFileId}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                            <Paperclip className="size-3.5" /> ansehen
                          </a>
                        ) : (
                          <Badge tone="amber">fehlt</Badge>
                        )}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="inline-flex sm:opacity-0 sm:group-hover:opacity-100">
                          <Modal title="Ausgabe bearbeiten" size="lg" trigger={<Button size="icon" variant="ghost" className="size-8" aria-label="Bearbeiten"><Pencil /></Button>}>
                            <ExpenseForm action={saveExpense.bind(null, e.id)} expense={e} {...formProps} />
                          </Modal>
                          <ActionButton action={deleteExpense.bind(null, e.id)} confirm="Ausgabe löschen?" variant="ghost" title="Löschen">
                            <Trash2 />
                          </ActionButton>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Nach Kategorie" description="netto im gewählten Zeitraum" />
            <div className="space-y-3 p-5">
              {categories.length === 0 && <p className="text-sm text-muted">Noch keine Daten.</p>}
              {categories.map(([cat, v]) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-fg-2">{EXPENSE_CATEGORY_MAP[cat]?.label ?? cat}</span>
                    <span className="font-medium num">{eur(v)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(v / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Offene Auslagen" description="Privat bezahlt, noch nicht erstattet" icon={<HandCoins />} />
            <div className="divide-y divide-line">
              {advancesByUser.size === 0 && <p className="px-5 py-4 text-sm text-muted">Keine offenen Auslagen.</p>}
              {[...advancesByUser.entries()].map(([uid, sum]) => (
                <div key={uid} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span>{userName(uid)}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium num">{eur(sum)}</span>
                    <ActionButton
                      action={markReimbursed.bind(null, openAdvances.filter((a) => a.paidByUserId === uid).map((a) => a.id))}
                      confirm={`${eur(sum)} an ${userName(uid)} erstattet?`}
                    >
                      Erstattet
                    </ActionButton>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
