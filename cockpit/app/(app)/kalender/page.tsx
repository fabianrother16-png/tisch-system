import { asc, eq, inArray } from "drizzle-orm";
import { CalendarPlus, ChevronLeft, ChevronRight, Rss } from "lucide-react";
import { db } from "@/lib/db";
import { customers, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Tabs";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventForm } from "@/components/calendar/EventForm";
import { CopyField } from "@/components/ui/CopyField";
import { saveEvent } from "@/lib/actions/events";
import { getCalendarItems } from "@/lib/domain/calendar";
import { addDays, addMonths, endOfMonth, isoWeek, startOfMonth, startOfWeek, todayISO, eachDay } from "@/lib/dates";
import { fmtDate, fmtMonth } from "@/lib/format";
import { appUrl } from "@/lib/env";

export const metadata = { title: "Kalender" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ansicht?: string; datum?: string; fristen?: string; nur?: string; neu?: string; kunde?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const today = todayISO();
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.datum ?? "") ? sp.datum! : today;
  const mode = sp.ansicht === "woche" || sp.ansicht === "agenda" ? sp.ansicht : "monat";
  const showDeadlines = sp.fristen !== "0";
  const onlyMe = sp.nur === "ich";

  let from: string;
  let to: string;
  let label: string;
  let prev: string;
  let next: string;
  if (mode === "monat") {
    from = startOfWeek(startOfMonth(anchor));
    const last = endOfMonth(anchor);
    to = addDays(startOfWeek(last), 6);
    label = fmtMonth(anchor.slice(0, 7));
    prev = addMonths(startOfMonth(anchor), -1);
    next = addMonths(startOfMonth(anchor), 1);
  } else if (mode === "woche") {
    from = startOfWeek(anchor);
    to = addDays(from, 6);
    label = `KW ${isoWeek(from)} · ${fmtDate(from).slice(0, 6)} – ${fmtDate(to)}`;
    prev = addDays(from, -7);
    next = addDays(from, 7);
  } else {
    from = anchor;
    to = addDays(anchor, 41);
    label = `${fmtDate(from)} – ${fmtDate(to)}`;
    prev = addDays(anchor, -42);
    next = addDays(anchor, 42);
  }

  const [items, customerRows, team] = await Promise.all([
    getCalendarItems(from, to, { deadlines: showDeadlines, userId: onlyMe ? me.id : undefined, customerId: sp.kunde ? Number(sp.kunde) : undefined }),
    db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.status, ["aktiv", "lead", "pausiert"])).orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true)),
  ]);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ansicht: mode === "monat" ? undefined : mode, datum: anchor === today ? undefined : anchor, fristen: sp.fristen, nur: sp.nur, kunde: sp.kunde, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/kalender${s ? `?${s}` : ""}`;
  };

  const feedUrl = `${appUrl()}/api/calendar/${me.calendarToken}`;

  return (
    <>
      <PageHeader
        title="Kalender"
        description="Drehs, Kundentermine und alle Fristen an einem Ort."
        actions={
          <>
            <Modal title="Kalender abonnieren" trigger={<Button variant="secondary"><Rss /> Abonnieren</Button>}>
              <div className="space-y-3 text-sm">
                <p className="text-muted">
                  Füge diese Adresse in Google Kalender („Weitere Kalender → Per URL“), Apple Kalender („Ablage → Neues Kalenderabonnement“) oder
                  Outlook ein. Dann siehst du alle Termine und Fristen direkt auf dem Handy. Der Link ist persönlich – nicht weitergeben.
                </p>
                <CopyField value={feedUrl} />
                <p className="text-xs text-muted">Aktualisiert sich automatisch (je nach Kalender-App alle paar Stunden).</p>
              </div>
            </Modal>
            <Modal
              title="Neuer Termin"
              size="lg"
              defaultOpen={sp.neu === "1"}
              trigger={<Button><CalendarPlus /> Termin</Button>}
            >
              <EventForm
                action={saveEvent.bind(null, null)}
                customers={customerRows}
                users={team}
                defaults={{ date: anchor, userId: me.id, customerId: sp.kunde ? Number(sp.kunde) : undefined }}
              />
            </Modal>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <LinkButton href={qs({ datum: prev })} size="icon" aria-label="Zurück"><ChevronLeft /></LinkButton>
          <span className="min-w-44 text-center font-semibold">{label}</span>
          <LinkButton href={qs({ datum: next })} size="icon" aria-label="Weiter"><ChevronRight /></LinkButton>
          <LinkButton href={qs({ datum: undefined })} size="sm" variant="ghost">Heute</LinkButton>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            active={onlyMe ? "ich" : "alle"}
            items={[
              { key: "alle", label: "Alle", href: qs({ nur: undefined }) },
              { key: "ich", label: "Nur meine", href: qs({ nur: "ich" }) },
            ]}
          />
          <Segmented
            active={showDeadlines ? "an" : "aus"}
            items={[
              { key: "an", label: "Mit Fristen", href: qs({ fristen: undefined }) },
              { key: "aus", label: "Nur Termine", href: qs({ fristen: "0" }) },
            ]}
          />
          <Segmented
            active={mode}
            items={[
              { key: "monat", label: "Monat", href: qs({ ansicht: undefined }) },
              { key: "woche", label: "Woche", href: qs({ ansicht: "woche" }) },
              { key: "agenda", label: "Agenda", href: qs({ ansicht: "agenda" }) },
            ]}
          />
        </div>
      </div>
      <CalendarView
        mode={mode}
        days={eachDay(from, to)}
        items={items}
        month={anchor.slice(0, 7)}
        today={today}
        customers={customerRows}
        users={team}
        userId={me.id}
      />
    </>
  );
}
