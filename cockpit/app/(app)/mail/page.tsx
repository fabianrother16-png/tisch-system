import Link from "next/link";
import { and, desc, eq, like, or } from "drizzle-orm";
import { ArrowDownLeft, ArrowUpRight, Inbox, MailPlus, Paperclip, RefreshCw, Settings } from "lucide-react";
import { db } from "@/lib/db";
import { customers, emails } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Tabs";
import { ActionButton } from "@/components/ui/form";
import { ComposeForm } from "@/components/mail/ComposeForm";
import { fetchMailNow } from "@/lib/actions/mail";
import { getMailConfig } from "@/lib/mail";
import { mailCustomerOptions } from "@/lib/domain/mailOptions";
import { fmtTimestamp } from "@/lib/format";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "E-Mail" };

export default async function MailPage({ searchParams }: { searchParams: Promise<{ ordner?: string; neu?: string; kunde?: string; q?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const folder = sp.ordner ?? "eingang";
  const term = sp.q?.trim();
  const [rows, options, cfg] = await Promise.all([
    db
      .select({ email: emails, customer: customers })
      .from(emails)
      .leftJoin(customers, eq(customers.id, emails.customerId))
      .where(
        and(
          folder === "eingang" ? eq(emails.direction, "ein") : folder === "gesendet" ? eq(emails.direction, "aus") : undefined,
          folder === "fehler" ? eq(emails.status, "fehler") : undefined,
          sp.kunde ? eq(emails.customerId, Number(sp.kunde)) : undefined,
          term ? or(like(emails.subject, `%${term}%`), like(emails.fromAddr, `%${term}%`), like(emails.toAddr, `%${term}%`), like(emails.text, `%${term}%`)) : undefined,
        ),
      )
      .orderBy(desc(emails.date))
      .limit(200),
    mailCustomerOptions(),
    getMailConfig(),
  ]);
  const qs = (o: string) => `/mail?ordner=${o}${sp.kunde ? `&kunde=${sp.kunde}` : ""}`;

  return (
    <>
      <PageHeader
        title="E-Mail"
        description={cfg.smtp ? `Postfach: ${cfg.fromAddress}` : "Noch kein Postfach eingerichtet"}
        actions={
          <>
            {cfg.imap && (
              <ActionButton action={fetchMailNow} size="md">
                <RefreshCw /> Abrufen
              </ActionButton>
            )}
            <Modal title="Neue E-Mail" size="lg" defaultOpen={sp.neu === "1"} trigger={<Button><MailPlus /> Neue E-Mail</Button>}>
              <ComposeForm customers={options} defaults={{ customerId: sp.kunde ? Number(sp.kunde) : undefined }} />
            </Modal>
          </>
        }
      />
      {!cfg.smtp && (
        <Card className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Verbindet euer E-Mail-Postfach</p>
            <p className="text-sm text-muted">
              Dann verschickt ihr Angebote, Rechnungen und Reports direkt aus dem Cockpit und seht eingehende Kundenmails in der Kundenakte.
              Funktioniert mit jedem Anbieter (IONOS, Strato, Google Workspace, Outlook …).
            </p>
          </div>
          <LinkButton href="/einstellungen?tab=email" variant="primary"><Settings /> Einrichten</LinkButton>
        </Card>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          active={folder}
          items={[
            { key: "eingang", label: "Posteingang", href: qs("eingang") },
            { key: "gesendet", label: "Gesendet", href: qs("gesendet") },
            { key: "fehler", label: "Fehlgeschlagen", href: qs("fehler") },
            { key: "alle", label: "Alle", href: qs("alle") },
          ]}
        />
        <form className="flex gap-2">
          <input type="hidden" name="ordner" value={folder} />
          <input name="q" defaultValue={term} placeholder="Suchen …" className="input w-56" />
        </form>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<Inbox />} title="Keine E-Mails" description={folder === "eingang" && !cfg.imap ? "Für den Posteingang bitte IMAP in den Einstellungen eintragen." : undefined} />
        ) : (
          <div className="divide-y divide-line">
            {rows.map(({ email: m, customer: c }) => (
              <Link key={m.id} href={`/mail/${m.id}`} className={cn("flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5", !m.isRead && "bg-accent-soft/40")}>
                <span className={`mt-1 rounded-full p-1 ${m.direction === "aus" ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                  {m.direction === "aus" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cn("truncate text-sm", !m.isRead ? "font-semibold" : "font-medium")}>{m.direction === "aus" ? `An: ${m.toAddr}` : m.fromAddr}</p>
                    <span className="shrink-0 text-xs text-muted">{fmtTimestamp(m.date)}</span>
                  </div>
                  <p className={cn("truncate text-sm", !m.isRead ? "text-fg" : "text-fg-2")}>{m.subject}</p>
                  <p className="truncate text-xs text-muted">{(m.text ?? "").replace(/\s+/g, " ").slice(0, 140)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {c && (
                      <span className="inline-flex items-center gap-1 text-xs text-fg-2">
                        <CustomerMark name={c.name} color={c.color} size="sm" /> {c.name}
                      </span>
                    )}
                    {m.attachments.length > 0 && <Badge><Paperclip className="size-3" /> {m.attachments.length}</Badge>}
                    {m.status === "fehler" && <Badge tone="red">nicht gesendet</Badge>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
