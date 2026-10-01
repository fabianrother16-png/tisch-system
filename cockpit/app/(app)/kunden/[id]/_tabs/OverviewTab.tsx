import Link from "next/link";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { CalendarDays, FileSignature, ListTodo, Mail, Pencil, Phone, Plus, Star, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { activities, contacts, contracts, events, tasks, users, type Customer } from "@/lib/db/schema";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContactForm } from "@/components/customers/ContactForm";
import { NoteForm } from "@/components/customers/NoteForm";
import { Timeline } from "@/components/customers/Timeline";
import { QuotaBars, QuotaLegend } from "@/components/customers/QuotaBars";
import { SnapshotTiles } from "@/components/customers/SnapshotTiles";
import { addNote, saveContact } from "@/lib/actions/customers";
import { getMonthlyQuota } from "@/lib/domain/quota";
import { getCustomerSnapshot } from "@/lib/domain/performance";
import { contractTerm, noticeLabel } from "@/lib/domain/contracts";
import { CONTRACT_STATUS_MAP, EVENT_TYPE_MAP, TASK_PRIORITY_MAP } from "@/lib/constants";
import { currentMonth, dayOfWeek, diffDays, nowLocal, todayISO } from "@/lib/dates";
import { eur, fmtDate, fmtDateTime, fmtMonth, relativeDays, WEEKDAYS_SHORT } from "@/lib/format";

export async function OverviewTab({ customer }: { customer: Customer }) {
  const id = customer.id;
  const today = todayISO();
  const month = currentMonth();
  const [quota, snapshot, contactRows, contractRows, upcoming, openTasks, recent, team] = await Promise.all([
    getMonthlyQuota(month, id),
    getCustomerSnapshot(id),
    db.select().from(contacts).where(eq(contacts.customerId, id)).orderBy(desc(contacts.isPrimary), asc(contacts.name)),
    db.select().from(contracts).where(and(eq(contracts.customerId, id), inArray(contracts.status, ["aktiv", "gekuendigt"]))),
    db.select().from(events).where(and(eq(events.customerId, id), gte(events.start, nowLocal().slice(0, 10)))).orderBy(asc(events.start)).limit(5),
    db.select().from(tasks).where(and(eq(tasks.customerId, id), eq(tasks.status, "offen"))).orderBy(asc(tasks.dueDate)).limit(6),
    db.select().from(activities).where(eq(activities.customerId, id)).orderBy(desc(activities.createdAt)).limit(8),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const userNames = Object.fromEntries(team.map((u) => [u.id, u.name]));
  const q = quota[0];

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        {snapshot.length > 0 ? (
          <SnapshotTiles items={snapshot.slice(0, 8)} />
        ) : (
          <Card>
            <EmptyState
              icon={<Star />}
              title="Noch keine Performance-Zahlen"
              description="Verbindet die Kanäle des Kunden oder tragt Zahlen manuell ein – dann seht ihr hier Follower, Aufrufe, Google-Bewertungen und Klicks."
              action={<LinkButton href={`/kunden/${id}?tab=anbindungen`}>Kanäle verbinden</LinkButton>}
            />
          </Card>
        )}

        <Card>
          <CardHeader
            title={`Soll & Ist im ${fmtMonth(month)}`}
            description="Was laut Vertrag diesen Monat geliefert werden muss"
            actions={
              <LinkButton href={`/content?kunde=${id}`} size="sm">
                Content-Board
              </LinkButton>
            }
          />
          <CardBody>
            {q ? (
              <div className="space-y-4">
                <QuotaBars row={q} />
                <QuotaLegend />
              </div>
            ) : (
              <p className="text-sm text-muted">
                Kein aktiver Vertrag mit monatlichem Leistungsumfang. Legt unter „Verträge“ fest, wie viele Videos, Beiträge und
                Vor-Ort-Termine pro Monat vereinbart sind.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Verlauf" description="Notizen, Gespräche und alles, was passiert ist" />
          <CardBody className="space-y-6">
            <NoteForm action={addNote.bind(null, id)} />
            <Timeline items={recent} userNames={userNames} customerId={id} />
            {recent.length >= 8 && (
              <Link href={`/kunden/${id}?tab=verlauf`} className="block text-center text-sm font-medium text-accent hover:underline">
                Gesamten Verlauf anzeigen
              </Link>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Ansprechpartner"
            icon={<UserRound />}
            actions={
              <Modal title="Kontakt hinzufügen" trigger={<Button size="sm" variant="ghost"><Plus /> Neu</Button>}>
                <ContactForm action={saveContact.bind(null, id, null)} />
              </Modal>
            }
          />
          <div className="divide-y divide-line">
            {contactRows.length === 0 && <p className="px-5 py-4 text-sm text-muted">Noch keine Kontakte hinterlegt.</p>}
            {contactRows.map((c) => (
              <div key={c.id} className="group flex items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {c.name}
                    {c.isPrimary && <Badge tone="accent">Haupt</Badge>}
                  </p>
                  {c.position && <p className="text-xs text-muted">{c.position}</p>}
                  <div className="mt-1.5 space-y-0.5 text-xs">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-fg-2 hover:text-accent">
                        <Mail className="size-3.5" /> {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-fg-2 hover:text-accent">
                        <Phone className="size-3.5" /> {c.phone}
                      </a>
                    )}
                  </div>
                </div>
                <Modal title="Kontakt bearbeiten" trigger={<Button size="icon" variant="ghost" aria-label="Bearbeiten" className="size-7 opacity-60 group-hover:opacity-100"><Pencil /></Button>}>
                  <ContactForm action={saveContact.bind(null, id, c.id)} contact={c} />
                </Modal>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Vertrag & Konditionen"
            icon={<FileSignature />}
            actions={<LinkButton href={`/kunden/${id}?tab=vertraege`} size="sm" variant="ghost">Alle</LinkButton>}
          />
          <div className="divide-y divide-line">
            {contractRows.length === 0 && (
              <div className="px-5 py-4 text-sm text-muted">
                Kein aktiver Vertrag.{" "}
                <Link className="font-medium text-accent hover:underline" href={`/kunden/${id}?tab=vertraege`}>
                  Vertrag anlegen
                </Link>
              </div>
            )}
            {contractRows.map((c) => {
              const term = contractTerm(c, today);
              const urgent = term.daysToNotice != null && term.daysToNotice >= 0 && term.daysToNotice <= 30;
              return (
                <div key={c.id} className="space-y-2 px-5 py-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{c.title}</p>
                    <StatusBadge value={c.status} map={CONTRACT_STATUS_MAP} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-muted">Vergütung</dt>
                    <dd className="text-right font-medium num">{eur(c.monthlyFee)} / Monat</dd>
                    {c.videosPerMonth > 0 && (<><dt className="text-muted">Videos</dt><dd className="text-right">{c.videosPerMonth} / Monat</dd></>)}
                    {c.postsPerMonth > 0 && (<><dt className="text-muted">Beiträge</dt><dd className="text-right">{c.postsPerMonth} / Monat</dd></>)}
                    {c.visitsPerMonth > 0 && (<><dt className="text-muted">Vor-Ort</dt><dd className="text-right">{c.visitsPerMonth}× / Monat</dd></>)}
                    <dt className="text-muted">Kündigungsfrist</dt>
                    <dd className="text-right">{noticeLabel(c)}</dd>
                    {term.termEnd && (<><dt className="text-muted">Laufzeit bis</dt><dd className="text-right">{fmtDate(term.termEnd)}</dd></>)}
                  </dl>
                  {term.noticeDeadline && (
                    <p className={`rounded-lg px-3 py-2 text-xs ${urgent ? "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" : "bg-surface-2 text-muted"}`}>
                      Kündbar bis <strong>{fmtDate(term.noticeDeadline)}</strong> ({relativeDays(diffDays(term.noticeDeadline, today))})
                      {term.renews ? ", sonst Verlängerung" : ""}
                    </p>
                  )}
                  {c.conditions && <p className="prose-notes rounded-lg bg-surface-2 px-3 py-2 text-xs">{c.conditions}</p>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Nächste Termine"
            icon={<CalendarDays />}
            actions={<LinkButton href={`/kalender?neu=1&kunde=${id}`} size="sm" variant="ghost"><Plus /> Termin</LinkButton>}
          />
          <div className="divide-y divide-line">
            {upcoming.length === 0 && <p className="px-5 py-4 text-sm text-muted">Keine anstehenden Termine.</p>}
            {upcoming.map((e) => (
              <Link key={e.id} href={`/kalender?datum=${e.start.slice(0, 10)}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[11px] text-muted uppercase">{WEEKDAYS_SHORT[dayOfWeek(e.start)]}</p>
                  <p className="font-semibold num">{e.start.slice(8, 10)}.{e.start.slice(5, 7)}.</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-xs text-muted">
                    {EVENT_TYPE_MAP[e.type]?.label ?? e.type} · {e.allDay ? "ganztägig" : fmtDateTime(e.start).split(", ")[1]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Offene Aufgaben"
            icon={<ListTodo />}
            actions={<LinkButton href={`/aufgaben?neu=1&kunde=${id}`} size="sm" variant="ghost"><Plus /> Aufgabe</LinkButton>}
          />
          <div className="divide-y divide-line">
            {openTasks.length === 0 && <p className="px-5 py-4 text-sm text-muted">Alles erledigt.</p>}
            {openTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{t.title}</p>
                  <p className={`text-xs ${t.dueDate && t.dueDate < today ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
                    {t.dueDate ? `fällig ${fmtDate(t.dueDate)}` : "ohne Termin"}
                    {t.assigneeId && userNames[t.assigneeId] ? ` · ${userNames[t.assigneeId]}` : ""}
                  </p>
                </div>
                {t.priority === "hoch" && <StatusBadge value={t.priority} map={TASK_PRIORITY_MAP} />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
