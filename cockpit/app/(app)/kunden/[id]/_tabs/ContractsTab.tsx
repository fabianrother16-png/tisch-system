import { asc, desc, eq } from "drizzle-orm";
import { Ban, FileSignature, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { contracts, services, type Customer } from "@/lib/db/schema";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/ui/form";
import { ContractForm, CancelContractForm } from "@/components/customers/ContractForm";
import { cancelContract, deleteContract, saveContract } from "@/lib/actions/contracts";
import { contractTerm, noticeLabel } from "@/lib/domain/contracts";
import { BILLING_INTERVALS, CONTRACT_STATUS_MAP } from "@/lib/constants";
import { diffDays, todayISO } from "@/lib/dates";
import { eur, fmtDate, relativeDays } from "@/lib/format";

export async function ContractsTab({ customer }: { customer: Customer }) {
  const id = customer.id;
  const today = todayISO();
  const [rows, serviceRows] = await Promise.all([
    db.select().from(contracts).where(eq(contracts.customerId, id)).orderBy(desc(contracts.startDate)),
    db.select({ name: services.name }).from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder)),
  ]);
  const serviceNames = serviceRows.map((s) => s.name);

  const newButton = (
    <Modal title="Neuer Vertrag" size="lg" trigger={<Button><Plus /> Vertrag anlegen</Button>}>
      <ContractForm action={saveContract.bind(null, id, null)} serviceNames={serviceNames} today={today} />
    </Modal>
  );

  if (!rows.length) {
    return (
      <Card>
        <EmptyState
          icon={<FileSignature />}
          title="Noch kein Vertrag"
          description="Hinterlegt Paket, Preis, Laufzeit, Kündigungsfrist und wie viele Videos, Beiträge und Vor-Ort-Termine pro Monat vereinbart sind. Daraus berechnet das Cockpit automatisch euer Monats-Soll und erinnert an Fristen."
          action={newButton}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{newButton}</div>
      {rows.map((c) => {
        const term = contractTerm(c, today);
        const interval = BILLING_INTERVALS.find((b) => b.value === c.billingInterval)?.label;
        return (
          <Card key={c.id} className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{c.title}</h3>
                <StatusBadge value={c.status} map={CONTRACT_STATUS_MAP} />
                {c.autoInvoice && <Badge tone="blue">Serienrechnung</Badge>}
                {c.fileId && (
                  <a href={`/api/files/${c.fileId}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                    <Paperclip className="size-3.5" /> Vertrag (PDF)
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Modal title="Vertrag bearbeiten" size="lg" trigger={<Button size="sm" variant="secondary"><Pencil /> Bearbeiten</Button>}>
                  <ContractForm action={saveContract.bind(null, id, c.id)} contract={c} serviceNames={serviceNames} today={today} />
                </Modal>
                {c.status === "aktiv" && (
                  <Modal title="Kündigung erfassen" size="sm" trigger={<Button size="sm" variant="ghost"><Ban /> Kündigen</Button>}>
                    <CancelContractForm action={cancelContract.bind(null, id, c.id)} suggestedEnd={term.termEnd ?? today} />
                  </Modal>
                )}
                <ActionButton action={deleteContract.bind(null, id, c.id)} confirm="Vertrag wirklich löschen?" variant="ghost" title="Löschen">
                  <Trash2 />
                </ActionButton>
              </div>
            </div>
            <div className="grid gap-6 px-5 py-5 md:grid-cols-3">
              <dl className="space-y-2 text-sm">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Laufzeit</p>
                <div className="flex justify-between gap-2"><dt className="text-muted">Beginn</dt><dd>{fmtDate(c.startDate)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Mindestlaufzeit</dt><dd>{c.minTermMonths ? `${c.minTermMonths} Monate` : "keine"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Verlängerung</dt><dd>{c.autoRenewMonths ? `um ${c.autoRenewMonths} Monate` : "keine"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Kündigungsfrist</dt><dd>{noticeLabel(c)}</dd></div>
                {term.termEnd && <div className="flex justify-between gap-2"><dt className="text-muted">{c.status === "gekuendigt" ? "Endet am" : "Aktuelle Laufzeit bis"}</dt><dd className="font-medium">{fmtDate(term.termEnd)}</dd></div>}
                {term.noticeDeadline && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Kündbar bis</dt>
                    <dd className={term.daysToNotice != null && term.daysToNotice <= 30 ? "font-semibold text-amber-700 dark:text-amber-300" : ""}>
                      {fmtDate(term.noticeDeadline)} <span className="text-xs text-muted">({relativeDays(diffDays(term.noticeDeadline, today))})</span>
                    </dd>
                  </div>
                )}
              </dl>
              <dl className="space-y-2 text-sm">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Leistung pro Monat</p>
                <div className="flex justify-between gap-2"><dt className="text-muted">Videos / Reels</dt><dd>{c.videosPerMonth}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Beiträge</dt><dd>{c.postsPerMonth}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Vor-Ort-Termine</dt><dd>{c.visitsPerMonth}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Werbebudget Kunde</dt><dd className="num">{c.adBudgetMonthly ? eur(c.adBudgetMonthly) : "–"}</dd></div>
                {c.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.services.map((s) => <Badge key={s}>{s}</Badge>)}
                  </div>
                )}
              </dl>
              <dl className="space-y-2 text-sm">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Konditionen</p>
                <div className="flex justify-between gap-2"><dt className="text-muted">Vergütung (netto)</dt><dd className="font-semibold num">{eur(c.monthlyFee)} / Monat</dd></div>
                {c.setupFee > 0 && <div className="flex justify-between gap-2"><dt className="text-muted">Einrichtung</dt><dd className="num">{eur(c.setupFee)}</dd></div>}
                <div className="flex justify-between gap-2"><dt className="text-muted">Abrechnung</dt><dd>{interval}</dd></div>
                {c.autoInvoice && <div className="flex justify-between gap-2"><dt className="text-muted">Nächste Rechnung</dt><dd>{fmtDate(c.nextInvoiceDate)}</dd></div>}
                {c.signedAt && <div className="flex justify-between gap-2"><dt className="text-muted">Unterschrieben</dt><dd>{fmtDate(c.signedAt)}</dd></div>}
              </dl>
            </div>
            {(c.conditions || c.notes) && (
              <div className="grid gap-4 border-t border-line bg-surface-2 px-5 py-4 md:grid-cols-2">
                {c.conditions && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted">Besondere Bedingungen</p>
                    <p className="prose-notes">{c.conditions}</p>
                  </div>
                )}
                {c.notes && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted">Interne Notizen</p>
                    <p className="prose-notes">{c.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
