import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Paperclip, Reply, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/form";
import { ComposeForm } from "@/components/mail/ComposeForm";
import { AssignForm } from "@/components/mail/AssignForm";
import { assignMailCustomer, deleteMail } from "@/lib/actions/mail";
import { mailCustomerOptions } from "@/lib/domain/mailOptions";
import { fmtTimestamp } from "@/lib/format";

export default async function MailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [m] = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  if (!m) notFound();
  if (!m.isRead) await db.update(emails).set({ isRead: true }).where(eq(emails.id, id));
  const options = await mailCustomerOptions();
  const replyTo = m.direction === "ein" ? (m.fromAddr.match(/<([^>]+)>/)?.[1] ?? m.fromAddr) : m.toAddr;
  const quoted = (m.text ?? "").split("\n").map((l) => `> ${l}`).join("\n");

  return (
    <>
      <PageHeader
        back={{ href: "/mail", label: "E-Mail" }}
        title={m.subject}
        meta={
          <>
            <Badge tone={m.direction === "aus" ? "blue" : "green"}>{m.direction === "aus" ? "gesendet" : "empfangen"}</Badge>
            {m.status === "fehler" && <Badge tone="red">Fehler</Badge>}
            <span className="text-sm text-muted">{fmtTimestamp(m.date)}</span>
          </>
        }
        actions={
          <>
            <Modal title="Antworten" size="lg" trigger={<Button><Reply /> Antworten</Button>}>
              <ComposeForm
                customers={options}
                defaults={{
                  customerId: m.customerId ?? undefined,
                  to: replyTo,
                  subject: m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`,
                  body: `\n\n\nAm ${fmtTimestamp(m.date)} schrieb ${m.fromAddr}:\n${quoted}`,
                  inReplyTo: m.messageId ?? undefined,
                }}
              />
            </Modal>
            <ActionButton action={deleteMail.bind(null, id)} confirm="E-Mail aus dem Cockpit entfernen?" variant="ghost" size="md">
              <Trash2 />
            </ActionButton>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardBody className="space-y-4">
            <dl className="grid grid-cols-[60px_1fr] gap-y-1 text-sm">
              <dt className="text-muted">Von</dt><dd>{m.fromAddr}</dd>
              <dt className="text-muted">An</dt><dd>{m.toAddr}</dd>
              {m.cc && (<><dt className="text-muted">CC</dt><dd>{m.cc}</dd></>)}
            </dl>
            {m.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {m.attachments.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-xs"><Paperclip className="size-3.5" /> {a}</span>
                ))}
              </div>
            )}
            {m.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-200">{m.error}</p>}
            <div className="border-t border-line pt-4">
              {m.text ? (
                <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-fg">{m.text}</pre>
              ) : m.html ? (
                <iframe sandbox="" srcDoc={m.html} title="E-Mail" className="h-[60vh] w-full rounded-lg border border-line bg-white" />
              ) : (
                <p className="text-sm text-muted">(kein Inhalt)</p>
              )}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="mb-2 text-sm font-semibold">Kunde</p>
            <AssignForm action={assignMailCustomer.bind(null, id)} customers={options} current={m.customerId} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
