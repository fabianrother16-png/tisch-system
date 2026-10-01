import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { CheckCircle2, Copy, Download, ExternalLink, FileSignature, Mail, Pencil, Receipt, Trash2, XCircle, Send } from "lucide-react";
import { db } from "@/lib/db";
import { emails, quotes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/form";
import { DocumentEditor } from "@/components/finance/DocumentEditor";
import { SendMailForm } from "@/components/finance/SendMailForm";
import { deleteQuote, duplicateQuote, quoteToContract, quoteToInvoice, saveQuote, sendQuoteMail, setQuoteStatus } from "@/lib/actions/quotes";
import { loadQuoteDocument } from "@/lib/domain/documents";
import { getEditorOptions } from "@/lib/domain/editor";
import { mailDraft } from "@/lib/domain/attachments";
import { QUOTE_STATUS_MAP } from "@/lib/constants";
import { eur, fmtDate, fmtTimestamp } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const [q] = await db.select({ number: quotes.number }).from(quotes).where(eq(quotes.id, Number((await params).id))).limit(1);
  return { title: q ? `Angebot ${q.number}` : "Angebot" };
}

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bearbeiten?: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const { bearbeiten } = await searchParams;
  const doc = await loadQuoteDocument(id);
  if (!doc) notFound();
  const { quote: q, customer } = doc;
  const editable = q.status !== "angenommen";

  if (editable && bearbeiten) {
    const { customers, services, invoicing } = await getEditorOptions();
    return (
      <>
        <PageHeader title={`Angebot ${q.number} bearbeiten`} back={{ href: `/angebote/${id}`, label: "Zurück zur Vorschau" }} />
        <DocumentEditor
          kind="angebot"
          action={saveQuote.bind(null, id)}
          customers={customers}
          services={services}
          kleinunternehmer={invoicing.kleinunternehmer}
          defaultTaxRate={invoicing.defaultTaxRate}
          defaultPaymentDays={invoicing.paymentTermDays}
          initial={{ customerId: q.customerId, title: q.title, issueDate: q.issueDate, validUntil: q.validUntil, intro: q.intro, outro: q.outro, discountPercent: q.discountPercent, items: doc.data.items }}
        />
      </>
    );
  }

  const [mailRows, draft] = await Promise.all([
    db.select().from(emails).where(and(eq(emails.refType, "quote"), eq(emails.refId, id))).orderBy(desc(emails.date)),
    mailDraft("angebot", id, user.name),
  ]);

  return (
    <>
      <PageHeader
        back={{ href: "/angebote", label: "Angebote" }}
        title={`Angebot ${q.number}`}
        description={q.title}
        meta={
          <>
            <StatusBadge value={q.status} map={QUOTE_STATUS_MAP} />
            <Link href={`/kunden/${customer.id}?tab=finanzen`} className="text-sm text-muted hover:text-fg">{customer.name}</Link>
          </>
        }
        actions={
          <>
            {editable && <LinkButton href={`/angebote/${id}?bearbeiten=1`}><Pencil /> Bearbeiten</LinkButton>}
            {draft && (
              <Modal title="Angebot per E-Mail senden" size="lg" trigger={<Button><Mail /> Per E-Mail senden</Button>}>
                <SendMailForm action={sendQuoteMail.bind(null, id)} draft={draft} attachments={[`Angebot_${q.number}.pdf`]} />
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
              <LinkButton href={`/api/quotes/${id}/pdf`} target="_blank" size="sm" variant="ghost"><ExternalLink /> Öffnen</LinkButton>
              <LinkButton href={`/api/quotes/${id}/pdf?download=1`} size="sm" variant="ghost"><Download /> PDF</LinkButton>
            </div>
          </div>
          <iframe src={`/api/quotes/${id}/pdf#view=FitH&navpanes=0`} title="Angebotsvorschau" className="h-[78vh] min-h-[600px] w-full bg-surface-3" />
        </Card>
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Angebotssumme</span>
                <span className="text-2xl font-semibold num">{eur(q.grossTotal)}</span>
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Netto</dt><dd className="num">{eur(q.netTotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Datum</dt><dd>{fmtDate(q.issueDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Gültig bis</dt><dd>{fmtDate(q.validUntil)}</dd></div>
                {q.sentAt && <div className="flex justify-between"><dt className="text-muted">Versendet</dt><dd>{fmtTimestamp(q.sentAt)}</dd></div>}
                {q.decidedAt && <div className="flex justify-between"><dt className="text-muted">Entschieden</dt><dd>{fmtDate(q.decidedAt)}</dd></div>}
                {q.invoiceId && <div className="flex justify-between"><dt className="text-muted">Rechnung</dt><dd><Link className="text-accent hover:underline" href={`/rechnungen/${q.invoiceId}`}>öffnen</Link></dd></div>}
                {q.contractId && <div className="flex justify-between"><dt className="text-muted">Vertrag</dt><dd><Link className="text-accent hover:underline" href={`/kunden/${q.customerId}?tab=vertraege`}>öffnen</Link></dd></div>}
              </dl>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Wie hat der Kunde entschieden?" />
            <CardBody className="grid gap-2">
              {q.status !== "angenommen" && (
                <ActionButton action={setQuoteStatus.bind(null, id, "angenommen")} size="md" variant="primary" className="justify-start">
                  <CheckCircle2 /> Angenommen
                </ActionButton>
              )}
              {q.status !== "abgelehnt" && q.status !== "angenommen" && (
                <ActionButton action={setQuoteStatus.bind(null, id, "abgelehnt")} size="md" className="justify-start">
                  <XCircle /> Abgelehnt
                </ActionButton>
              )}
              {q.status === "entwurf" && (
                <ActionButton action={setQuoteStatus.bind(null, id, "versendet")} size="md" className="justify-start">
                  <Send /> Als versendet markieren
                </ActionButton>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Weiterverarbeiten" />
            <CardBody className="grid gap-2">
              {!q.invoiceId ? (
                <ActionButton action={quoteToInvoice.bind(null, id)} size="md" className="justify-start">
                  <Receipt /> In Rechnung umwandeln
                </ActionButton>
              ) : (
                <Badge tone="green">Rechnung erstellt</Badge>
              )}
              {!q.contractId && (
                <ActionButton action={quoteToContract.bind(null, id)} size="md" className="justify-start" title="Monatliche Positionen werden zur Vertragsvergütung">
                  <FileSignature /> Vertrag daraus anlegen
                </ActionButton>
              )}
              <ActionButton action={duplicateQuote.bind(null, id)} size="md" className="justify-start">
                <Copy /> Kopieren
              </ActionButton>
              {q.status !== "angenommen" && (
                <ActionButton action={deleteQuote.bind(null, id)} confirm="Angebot löschen?" size="md" variant="ghost" className="justify-start text-red-600">
                  <Trash2 /> Löschen
                </ActionButton>
              )}
            </CardBody>
          </Card>
          {mailRows.length > 0 && (
            <Card>
              <CardHeader title="E-Mail-Verlauf" />
              <div className="divide-y divide-line">
                {mailRows.map((m) => (
                  <Link key={m.id} href={`/mail/${m.id}`} className="block px-5 py-3 text-sm hover:bg-surface-2">
                    <p className="truncate font-medium">{m.subject}</p>
                    <p className="text-xs text-muted">{fmtTimestamp(m.date)} · an {m.toAddr}{m.status === "fehler" && <span className="text-red-600"> · Fehler</span>}</p>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
