import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowDownLeft, ArrowUpRight, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { activities, emails, users, type Customer } from "@/lib/db/schema";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NoteForm } from "@/components/customers/NoteForm";
import { Timeline } from "@/components/customers/Timeline";
import { addNote } from "@/lib/actions/customers";
import { fmtTimestamp } from "@/lib/format";

export async function TimelineTab({ customer }: { customer: Customer }) {
  const id = customer.id;
  const [items, mails, team] = await Promise.all([
    db.select().from(activities).where(eq(activities.customerId, id)).orderBy(desc(activities.createdAt)).limit(200),
    db.select().from(emails).where(eq(emails.customerId, id)).orderBy(desc(emails.date)).limit(50),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const userNames = Object.fromEntries(team.map((u) => [u.id, u.name]));
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader title="Verlauf" description="Alle Notizen, Gespräche und Ereignisse" />
        <CardBody className="space-y-6">
          <NoteForm action={addNote.bind(null, id)} />
          <Timeline items={items} userNames={userNames} customerId={id} />
        </CardBody>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader
          title="E-Mails"
          icon={<Mail />}
          actions={<LinkButton href={`/mail?neu=1&kunde=${id}`} size="sm" variant="primary">Neue E-Mail</LinkButton>}
        />
        <div className="divide-y divide-line">
          {mails.length === 0 && <p className="px-5 py-6 text-sm text-muted">Noch keine E-Mails mit diesem Kunden.</p>}
          {mails.map((m) => (
            <Link key={m.id} href={`/mail/${m.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-surface-2">
              <span className={`mt-0.5 rounded-full p-1 ${m.direction === "aus" ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                {m.direction === "aus" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.subject}</p>
                <p className="truncate text-xs text-muted">
                  {m.direction === "aus" ? `an ${m.toAddr}` : `von ${m.fromAddr}`} · {fmtTimestamp(m.date)}
                </p>
              </div>
              {m.status === "fehler" && <Badge tone="red">Fehler</Badge>}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
