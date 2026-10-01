import { and, eq, gte, inArray, isNotNull, lte, or } from "drizzle-orm";
import { db } from "../db";
import { contents, contracts, customers, events, invoices, quotes, tasks, type CalendarEvent } from "../db/schema";
import { contractTerm } from "./contracts";

export type CalendarItem = {
  key: string;
  kind: "event" | "content" | "invoice" | "contract" | "task" | "quote";
  type: string;
  title: string;
  date: string;
  endDate?: string | null;
  time?: string | null;
  endTime?: string | null;
  allDay: boolean;
  customerId?: number | null;
  customerName?: string | null;
  customerColor?: string | null;
  href?: string;
  event?: CalendarEvent;
};

/** Termine plus automatisch abgeleitete Fristen (Drehs, Postings, Fälligkeiten, Kündigungsfristen, Aufgaben). */
export async function getCalendarItems(
  from: string,
  to: string,
  opts: { deadlines?: boolean; userId?: number; customerId?: number } = {},
): Promise<CalendarItem[]> {
  const showDeadlines = opts.deadlines ?? true;
  const customerRows = await db.select({ id: customers.id, name: customers.name, color: customers.color }).from(customers);
  const cmap = new Map(customerRows.map((c) => [c.id, c]));
  const withCustomer = (id: number | null | undefined) => {
    const c = id ? cmap.get(id) : undefined;
    return { customerId: id ?? null, customerName: c?.name ?? null, customerColor: c?.color ?? null };
  };

  const eventRows = await db
    .select()
    .from(events)
    .where(
      and(
        lte(events.start, `${to}T23:59`),
        or(gte(events.start, from), and(isNotNull(events.end), gte(events.end, from))),
        opts.customerId ? eq(events.customerId, opts.customerId) : undefined,
      ),
    );

  const items: CalendarItem[] = eventRows
    .filter((e) => !opts.userId || e.assigneeIds.length === 0 || e.assigneeIds.includes(opts.userId))
    .map((e) => ({
      key: `e${e.id}`,
      kind: "event",
      type: e.type,
      title: e.title,
      date: e.start.slice(0, 10),
      endDate: e.end?.slice(0, 10) ?? null,
      time: e.allDay ? null : e.start.slice(11, 16),
      endTime: e.allDay || !e.end ? null : e.end.slice(11, 16),
      allDay: e.allDay,
      ...withCustomer(e.customerId),
      event: e,
    }));

  if (!showDeadlines) return sortItems(items);

  const linkedContentIds = new Set(eventRows.map((e) => e.contentId).filter(Boolean));
  const contentRows = await db
    .select()
    .from(contents)
    .where(
      and(
        or(and(gte(contents.shootDate, from), lte(contents.shootDate, to)), and(gte(contents.publishDate, from), lte(contents.publishDate, to))),
        opts.customerId ? eq(contents.customerId, opts.customerId) : undefined,
      ),
    );
  for (const c of contentRows) {
    if (c.shootDate && c.shootDate >= from && c.shootDate <= to && !linkedContentIds.has(c.id) && ["idee", "geplant", "dreh"].includes(c.status)) {
      items.push({ key: `cs${c.id}`, kind: "content", type: "dreh", title: `Dreh: ${c.title}`, date: c.shootDate, allDay: true, href: `/content?monat=${c.periodMonth}`, ...withCustomer(c.customerId) });
    }
    if (c.publishDate && c.publishDate >= from && c.publishDate <= to) {
      items.push({
        key: `cp${c.id}`,
        kind: "content",
        type: "posting",
        title: `${c.status === "veroeffentlicht" ? "Online" : "Posting"}: ${c.title}`,
        date: c.publishDate,
        allDay: true,
        href: `/content?monat=${c.periodMonth}`,
        ...withCustomer(c.customerId),
      });
    }
  }

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(and(inArray(invoices.status, ["offen", "teilbezahlt"]), gte(invoices.dueDate, from), lte(invoices.dueDate, to), opts.customerId ? eq(invoices.customerId, opts.customerId) : undefined));
  for (const i of invoiceRows) {
    items.push({ key: `i${i.id}`, kind: "invoice", type: "deadline", title: `Zahlung fällig: ${i.number}`, date: i.dueDate!, allDay: true, href: `/rechnungen/${i.id}`, ...withCustomer(i.customerId) });
  }

  const quoteRows = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.status, "versendet"), gte(quotes.validUntil, from), lte(quotes.validUntil, to), opts.customerId ? eq(quotes.customerId, opts.customerId) : undefined));
  for (const q of quoteRows) {
    items.push({ key: `q${q.id}`, kind: "quote", type: "deadline", title: `Angebot läuft ab: ${q.number}`, date: q.validUntil!, allDay: true, href: `/angebote/${q.id}`, ...withCustomer(q.customerId) });
  }

  const contractRows = await db.select().from(contracts).where(and(inArray(contracts.status, ["aktiv", "gekuendigt"]), opts.customerId ? eq(contracts.customerId, opts.customerId) : undefined));
  for (const c of contractRows) {
    const t = contractTerm(c);
    if (t.noticeDeadline && t.noticeDeadline >= from && t.noticeDeadline <= to) {
      items.push({ key: `cn${c.id}`, kind: "contract", type: "deadline", title: `Kündigungsfrist: ${c.title}`, date: t.noticeDeadline, allDay: true, href: `/kunden/${c.customerId}?tab=vertraege`, ...withCustomer(c.customerId) });
    }
    if (c.status === "gekuendigt" && t.termEnd && t.termEnd >= from && t.termEnd <= to) {
      items.push({ key: `ce${c.id}`, kind: "contract", type: "deadline", title: `Vertragsende: ${c.title}`, date: t.termEnd, allDay: true, href: `/kunden/${c.customerId}?tab=vertraege`, ...withCustomer(c.customerId) });
    }
  }

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, "offen"), gte(tasks.dueDate, from), lte(tasks.dueDate, to), opts.customerId ? eq(tasks.customerId, opts.customerId) : undefined));
  for (const t of taskRows) {
    if (opts.userId && t.assigneeId && t.assigneeId !== opts.userId) continue;
    items.push({ key: `t${t.id}`, kind: "task", type: "intern", title: `Aufgabe: ${t.title}`, date: t.dueDate!, allDay: true, href: `/aufgaben`, ...withCustomer(t.customerId) });
  }

  return sortItems(items);
}

function sortItems(items: CalendarItem[]) {
  return items.sort((a, b) => a.date.localeCompare(b.date) || Number(b.allDay) - Number(a.allDay) || (a.time ?? "").localeCompare(b.time ?? ""));
}
