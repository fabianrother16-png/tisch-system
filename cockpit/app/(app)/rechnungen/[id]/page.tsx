import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import {
  Ban,
  BellRing,
  CheckCheck,
  Copy,
  Download,
  FileCode2,
  Lock,
  Mail,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/db";
import { emails, invoices, payments, quotes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/form";
import { DocumentEditor } from "@/components/finance/DocumentEditor";
import { SendMailForm } from "@/components/finance/SendMailForm";
import { PaymentForm } from "@/components/finance/PaymentForm";
import {
  addPayment,
  cancelInvoice,
  deleteInvoiceDraft,
  deletePayment,
  duplicateInvoice,
  finalizeInvoice,
  markInvoiceSent,
  markPaidInFull,
  saveInvoice,
  sendInvoiceMail,
  sendReminderMail,
} from "@/lib/actions/invoices";
import { loadInvoiceDocument } from "@/lib/domain/documents";
import { getEditorOptions } from "@/lib/domain/editor";
import { mailDraft } from "@/lib/domain/attachments";
import { eInvoiceWarnings } from "@/lib/pdf/xrechnung";
import { INVOICE_STATUS_MAP, PAYMENT_METHODS } from "@/lib/constants";
import { diffDays, todayISO } from "@/lib/dates";
import { eur, fmtDate, fmtTimestamp } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const [inv] = await db.select({ number: invoices.number }).from(invoices).where(eq(invoices.id, Number((await params).id))).limit(1);
  return { title: inv?.number ? `Rechnung ${inv.number}` : "Rechnungsentwurf" };
}

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bearbeiten?: string }>;
}) {
  const user = await requireUser();
  const id = Number((await params).id);
  const { bearbeiten } = await searchParams;
  const doc = await loadInvoiceDocument(id);
  if (!doc) notFound();
  const { invoice: inv, customer } = doc;
  const today = todayISO();
  const isDraft = inv.status === "entwurf";
  const isOpen = inv.status === "offen" || inv.status === "teilbezahlt";
  const overdue = isOpen && inv.dueDate && inv.dueDate < today;
  const open = inv.grossTotal - inv.paidTotal;

  if (isDraft && bearbeiten) {
    const { customers, services, invoicing } = await getEditorOptions();
    return (
      <>
        <PageHeader title="Rechnungsentwurf bearbeiten" back={{ href: `/rechnungen/${id}`, label: "Zurück zur Vorschau" }} />
        <DocumentEditor
          kind="rechnung"
          action={saveInvoice.bind(null, id)}
          customers={customers}
          services={services}
          kleinunternehmer={invoicing.kleinunternehmer}
          defaultTaxRate={invoicing.defaultTaxRate}
          defaultPaymentDays={invoicing.paymentTermDays}
          initial={{
            customerId: inv.customerId,
            title: inv.title,
            issueDate: inv.issueDate,
            serviceFrom: inv.serviceFrom,
            serviceTo: inv.serviceTo,
            dueDate: inv.dueDate,
            intro: inv.intro,
            outro: inv.outro,
            discountPercent: inv.discountPercent,
            items: doc.data.items,
          }}
        />
      </>
    );
  }

  const [paymentRows, mailRows, related, invoiceDraft, reminderDraft] = await Promise.all([
    db.select().from(payments).where(eq(payments.invoiceId, id)).orderBy(desc(payments.date)),
    db.select().from(emails).where(and(eq(emails.refType, "invoice"), eq(emails.refId, id))).orderBy(desc(emails.date)),
    Promise.all([
      inv.cancelsInvoiceId ? db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(eq(invoices.id, inv.cancelsInvoiceId)).limit(1) : [],
      db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(eq(invoices.cancelsInvoiceId, id)).limit(1),
      inv.quoteId ? db.select({ id: quotes.id, number: quotes.number }).from(quotes).where(eq(quotes.id, inv.quoteId)).limit(1) : [],
    ]),
    mailDraft("rechnung", id, user.name),
    mailDraft("mahnung", id, user.name),
  ]);
  const [[original], [storno], [quote]] = related;
  const warnings = eInvoiceWarnings(doc.data, doc.billingEmail ?? doc.email);
  const pdfName = `${inv.kind === "storno" ? "Stornorechnung" : "Rechnung"}_${inv.number ?? "Entwurf"}.pdf`;

  return (
    <>
      <PageHeader
        back={{ href: "/rechnungen", label: "Rechnungen" }}
        title={inv.number ? `${inv.kind === "storno" ? "Stornorechnung" : "Rechnung"} ${inv.number}` : "Rechnungsentwurf"}
        description={inv.title}
        meta={
          <>
            <StatusBadge value={inv.status} map={INVOICE_STATUS_MAP} />
            {overdue && <Badge tone="red">{diffDays(today, inv.dueDate!)} Tage überfällig</Badge>}
            {inv.reminderLevel > 0 && <Badge tone="amber">{inv.reminderLevel}. Erinnerung am {fmtDate(inv.lastReminderAt)}</Badge>}
            {inv.finalizedAt && (
              <Badge>
                <Lock className="size-3" /> festgeschrieben
              </Badge>
            )}
            <Link href={`/kunden/${customer.id}?tab=finanzen`} className="text-sm text-muted hover:text-fg">
              {customer.name}
            </Link>
          </>
        }
        actions={
          <>
            {isDraft && (
              <LinkButton href={`/rechnungen/${id}?bearbeiten=1`}>
                <Pencil /> Bearbeiten
              </LinkButton>
            )}
            {invoiceDraft && (isDraft || isOpen) && (
              <Modal title="Rechnung per E-Mail senden" size="lg" trigger={<Button><Mail /> Per E-Mail senden</Button>}>
                {isDraft && (
                  <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                    Beim Versand wird die Rechnung festgeschrieben und erhält ihre fortlaufende Nummer. Danach sind keine Änderungen mehr möglich.
                  </p>
                )}
                <SendMailForm action={sendInvoiceMail.bind(null, id)} draft={invoiceDraft} attachments={[pdfName]} showXml warnings={warnings} />
              </Modal>
            )}
            {isOpen && (
              <Modal title="Zahlung erfassen" trigger={<Button variant="secondary"><Plus /> Zahlung</Button>}>
                <PaymentForm action={addPayment.bind(null, id)} open={open} today={today} />
              </Modal>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-xs font-medium text-muted">Vorschau</p>
            <div className="flex gap-1">
              <LinkButton href={`/api/invoices/${id}/pdf`} target="_blank" size="sm" variant="ghost">
                <ExternalLink /> Öffnen
              </LinkButton>
              <LinkButton href={`/api/invoices/${id}/pdf?download=1`} size="sm" variant="ghost">
                <Download /> PDF
              </LinkButton>
              {inv.number && (
                <LinkButton href={`/api/invoices/${id}/xml`} size="sm" variant="ghost" title="E-Rechnung (XRechnung)">
                  <FileCode2 /> XRechnung
                </LinkButton>
              )}
            </div>
          </div>
          <iframe src={`/api/invoices/${id}/pdf#view=FitH&navpanes=0`} title="Rechnungsvorschau" className="h-[78vh] min-h-[600px] w-full bg-surface-3" />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Gesamtbetrag</span>
                <span className="text-2xl font-semibold num">{eur(inv.grossTotal)}</span>
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Netto</dt><dd className="num">{eur(inv.netTotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Umsatzsteuer</dt><dd className="num">{eur(inv.taxTotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Bezahlt</dt><dd className="num">{eur(inv.paidTotal)}</dd></div>
                {isOpen && (
                  <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                    <dt>Offen</dt>
                    <dd className={`num ${overdue ? "text-red-600 dark:text-red-400" : ""}`}>{eur(open)}</dd>
                  </div>
                )}
              </dl>
              <dl className="space-y-1.5 border-t border-line pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Rechnungsdatum</dt><dd>{fmtDate(inv.issueDate)}</dd></div>
                {(inv.serviceFrom || inv.serviceTo) && (
                  <div className="flex justify-between"><dt className="text-muted">Leistung</dt><dd>{fmtDate(inv.serviceFrom)} – {fmtDate(inv.serviceTo)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-muted">Fällig</dt><dd>{fmtDate(inv.dueDate)}</dd></div>
                {inv.sentAt && <div className="flex justify-between"><dt className="text-muted">Versendet</dt><dd>{fmtTimestamp(inv.sentAt)}</dd></div>}
                {inv.paidAt && <div className="flex justify-between"><dt className="text-muted">Bezahlt am</dt><dd>{fmtDate(inv.paidAt)}</dd></div>}
                {original && <div className="flex justify-between"><dt className="text-muted">Storno zu</dt><dd><Link className="text-accent hover:underline" href={`/rechnungen/${original.id}`}>{original.number}</Link></dd></div>}
                {storno && <div className="flex justify-between"><dt className="text-muted">Storniert durch</dt><dd><Link className="text-accent hover:underline" href={`/rechnungen/${storno.id}`}>{storno.number}</Link></dd></div>}
                {quote && <div className="flex justify-between"><dt className="text-muted">Aus Angebot</dt><dd><Link className="text-accent hover:underline" href={`/angebote/${quote.id}`}>{quote.number}</Link></dd></div>}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Aktionen" />
            <CardBody className="grid gap-2">
              {isDraft && (
                <>
                  <ActionButton action={finalizeInvoice.bind(null, id)} confirm="Rechnung festschreiben? Danach erhält sie eine Nummer und ist nicht mehr änderbar." size="md" className="justify-start">
                    <Lock /> Festschreiben (ohne Versand)
                  </ActionButton>
                  <ActionButton action={markInvoiceSent.bind(null, id)} confirm="Festschreiben und als versendet markieren (z. B. per Post verschickt)?" size="md" className="justify-start">
                    <CheckCheck /> Festschreiben & als versendet markieren
                  </ActionButton>
                </>
              )}
              {isOpen && (
                <ActionButton action={markPaidInFull.bind(null, id)} confirm={`Zahlungseingang über ${eur(open)} mit heutigem Datum buchen?`} size="md" className="justify-start">
                  <CheckCheck /> Vollständig bezahlt (heute)
                </ActionButton>
              )}
              {isOpen && !inv.sentAt && (
                <ActionButton action={markInvoiceSent.bind(null, id)} size="md" className="justify-start">
                  <Mail /> Als versendet markieren
                </ActionButton>
              )}
              {isOpen && reminderDraft && (
                <Modal title="Zahlungserinnerung senden" size="lg" trigger={<Button variant="secondary" className="justify-start"><BellRing /> Zahlungserinnerung</Button>}>
                  <SendMailForm action={sendReminderMail.bind(null, id)} draft={reminderDraft} attachments={[pdfName]} submitLabel="Erinnerung senden" />
                </Modal>
              )}
              <ActionButton action={duplicateInvoice.bind(null, id)} size="md" className="justify-start">
                <Copy /> Als neue Rechnung kopieren
              </ActionButton>
              {inv.number && inv.kind !== "storno" && inv.status !== "storniert" && (
                <ActionButton
                  action={cancelInvoice.bind(null, id)}
                  confirm="Rechnung stornieren? Es wird eine Stornorechnung mit eigener Nummer erstellt (GoBD-konform)."
                  size="md"
                  variant="ghost"
                  className="justify-start text-red-600"
                >
                  <Ban /> Stornieren
                </ActionButton>
              )}
              {isDraft && (
                <ActionButton action={deleteInvoiceDraft.bind(null, id)} confirm="Entwurf löschen?" size="md" variant="ghost" className="justify-start text-red-600">
                  <Trash2 /> Entwurf löschen
                </ActionButton>
              )}
            </CardBody>
          </Card>

          {paymentRows.length > 0 && (
            <Card>
              <CardHeader title="Zahlungen" />
              <div className="divide-y divide-line">
                {paymentRows.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium num">{eur(p.amount)}</p>
                      <p className="text-xs text-muted">
                        {fmtDate(p.date)} · {PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <ActionButton action={deletePayment.bind(null, id, p.id)} confirm="Zahlung entfernen?" variant="ghost" title="Entfernen">
                      <Trash2 />
                    </ActionButton>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {mailRows.length > 0 && (
            <Card>
              <CardHeader title="E-Mail-Verlauf" />
              <div className="divide-y divide-line">
                {mailRows.map((m) => (
                  <Link key={m.id} href={`/mail/${m.id}`} className="block px-5 py-3 text-sm hover:bg-surface-2">
                    <p className="truncate font-medium">{m.subject}</p>
                    <p className="text-xs text-muted">
                      {fmtTimestamp(m.date)} · an {m.toAddr}
                      {m.status === "fehler" && <span className="text-red-600"> · Fehler</span>}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {inv.number && warnings.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-500/30">
              <CardBody className="text-sm">
                <p className="font-medium">Für eine gültige E-Rechnung fehlt noch:</p>
                <ul className="mt-1 list-disc pl-5 text-muted">
                  {warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
