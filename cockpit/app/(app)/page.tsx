import Link from "next/link";
import { and, count, desc, eq, gte, inArray, lt, lte, isNull, or, sql } from "drizzle-orm";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Clapperboard,
  FileSignature,
  FileText,
  Flame,
  Globe,
  ListTodo,
  Mail,
  Paperclip,
  Plug,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
  Repeat,
} from "lucide-react";
import { db } from "@/lib/db";
import { activities, contracts, customers, emails, expenses, integrations, invoices, posts, quotes, tasks, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { LinkButton } from "@/components/ui/Button";
import { CustomerMark } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { ColumnChart } from "@/components/charts/Charts";
import { QuotaLegend } from "@/components/customers/QuotaBars";
import { PlatformIcon } from "@/components/PlatformIcon";
import { TaskCheck } from "@/components/tasks/TaskCheck";
import { itemStyle } from "@/components/calendar/styles";
import { getMonthlyQuota } from "@/lib/domain/quota";
import { recentWebsiteInquiries } from "@/lib/domain/inquiries";
import { getCalendarItems } from "@/lib/domain/calendar";
import { contractTerm, monthlyValue } from "@/lib/domain/contracts";
import { monthlyOverview } from "@/lib/domain/finance";
import { generateRecurringInvoices } from "@/lib/domain/invoicing";
import { addDays, addMonthKey, currentMonth, dayOfWeek, diffDays, endOfMonth, startOfMonth, todayISO } from "@/lib/dates";
import { eur, fmtCompact, fmtDate, fmtDateLong, fmtMonth, fmtTimestamp, relativeDays, WEEKDAYS, WEEKDAYS_SHORT } from "@/lib/format";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Dashboard" };

type Alert = { icon: React.ReactNode; text: React.ReactNode; href: string; tone: "red" | "amber" | "blue" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "numeric" }).format(new Date()));
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
}

export default async function Dashboard() {
  const me = await requireUser();
  await generateRecurringInvoices(me.id).catch(() => 0);
  const today = todayISO();
  const month = currentMonth();
  const year = today.slice(0, 4);
  const weekEnd = addDays(today, 6);

  const [
    quota,
    upcoming,
    myTasks,
    activeContracts,
    [openInv],
    overdueInv,
    [drafts],
    staleQuotes,
    brokenConns,
    [unread],
    [missingReceipts],
    [activeCustomers],
    overview,
    prevOverview,
    recent,
    topPost,
    team,
  ] = await Promise.all([
    getMonthlyQuota(month),
    getCalendarItems(today, weekEnd, { deadlines: true }),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, "offen"), or(eq(tasks.assigneeId, me.id), isNull(tasks.assigneeId)), or(lte(tasks.dueDate, addDays(today, 7)), isNull(tasks.dueDate))))
      .orderBy(sql`${tasks.dueDate} is null`, tasks.dueDate)
      .limit(7),
    db.select().from(contracts).where(eq(contracts.status, "aktiv")),
    db.select({ v: sql<number>`coalesce(sum(${invoices.grossTotal} - ${invoices.paidTotal}),0)`, n: count() }).from(invoices).where(inArray(invoices.status, ["offen", "teilbezahlt"])),
    db
      .select({ invoice: invoices, name: customers.name })
      .from(invoices)
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(and(inArray(invoices.status, ["offen", "teilbezahlt"]), lt(invoices.dueDate, today))),
    db.select({ n: count() }).from(invoices).where(eq(invoices.status, "entwurf")),
    db
      .select({ quote: quotes, name: customers.name })
      .from(quotes)
      .innerJoin(customers, eq(customers.id, quotes.customerId))
      .where(and(eq(quotes.status, "versendet"), lte(quotes.issueDate, addDays(today, -10)))),
    db.select({ i: integrations, name: customers.name }).from(integrations).innerJoin(customers, eq(customers.id, integrations.customerId)).where(eq(integrations.status, "fehler")),
    db.select({ n: count() }).from(emails).where(and(eq(emails.direction, "ein"), eq(emails.isRead, false))),
    db
      .select({ n: count() })
      .from(expenses)
      .where(and(isNull(expenses.receiptFileId), gte(expenses.date, startOfMonth(addMonthKey(month, -1) + "-01")), lte(expenses.date, today))),
    db.select({ n: count() }).from(customers).where(eq(customers.status, "aktiv")),
    monthlyOverview(year),
    monthlyOverview(String(Number(year) - 1)),
    db
      .select({ a: activities, name: customers.name, color: customers.color })
      .from(activities)
      .leftJoin(customers, eq(customers.id, activities.customerId))
      .orderBy(desc(activities.createdAt))
      .limit(8),
    db
      .select({ p: posts, name: customers.name, color: customers.color })
      .from(posts)
      .innerJoin(customers, eq(customers.id, posts.customerId))
      .where(gte(posts.publishedAt, addDays(today, -30)))
      .orderBy(desc(posts.views))
      .limit(1),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const websiteInquiries = await recentWebsiteInquiries();

  const userNames = Object.fromEntries(team.map((u) => [u.id, u.name]));
  const mrr = activeContracts.reduce((s, c) => s + monthlyValue(c), 0);
  const thisMonth = overview.find((m) => m.month === month);
  const lastMonthKey = addMonthKey(month, -1);
  const lastMonth = (lastMonthKey.startsWith(year) ? overview : prevOverview).find((m) => m.month === lastMonthKey);
  const chartData = [...prevOverview, ...overview].filter((m) => m.month > addMonthKey(month, -12) && m.month <= month);
  const daysInMonth = Number(endOfMonth(today).slice(8, 10));
  const monthProgress = Number(today.slice(8, 10)) / daysInMonth;

  // ── Hinweise ──
  const alerts: Alert[] = [];
  for (const { a, name } of websiteInquiries) {
    alerts.push({
      icon: <Globe />,
      tone: "red",
      href: `/kunden/${a.customerId}?tab=verlauf`,
      text: (
        <>
          <strong>Neue Anfrage über die Website:</strong> {name} ({fmtTimestamp(a.createdAt)})
        </>
      ),
    });
  }
  for (const { invoice, name } of overdueInv) {
    alerts.push({
      icon: <Receipt />,
      tone: "red",
      href: `/rechnungen/${invoice.id}`,
      text: (
        <>
          <strong>{invoice.number}</strong> von {name} ist seit {diffDays(today, invoice.dueDate!)} Tagen überfällig ({eur(invoice.grossTotal - invoice.paidTotal)})
        </>
      ),
    });
  }
  for (const c of activeContracts) {
    const t = contractTerm(c, today);
    if (t.daysToNotice != null && t.daysToNotice >= 0 && t.daysToNotice <= 30) {
      alerts.push({
        icon: <FileSignature />,
        tone: "amber",
        href: `/kunden/${c.customerId}?tab=vertraege`,
        text: (
          <>
            Kündigungsfrist „{c.title}“ endet {relativeDays(t.daysToNotice)} ({fmtDate(t.noticeDeadline)}) – Verlängerung ansprechen
          </>
        ),
      });
    }
  }
  if (drafts.n > 0) {
    alerts.push({ icon: <Repeat />, tone: "blue", href: "/rechnungen?filter=entwurf", text: <>{drafts.n} Rechnungsentwurf{drafts.n === 1 ? "" : "e"} warten auf Prüfung & Versand</> });
  }
  for (const { quote, name } of staleQuotes) {
    alerts.push({ icon: <FileText />, tone: "blue", href: `/angebote/${quote.id}`, text: <>Angebot {quote.number} an {name} seit {diffDays(today, quote.issueDate)} Tagen ohne Antwort – nachhaken?</> });
  }
  if (monthProgress > 0.5) {
    for (const q of quota.filter((x) => x.visits.missing > 0)) {
      alerts.push({ icon: <CalendarDays />, tone: "amber", href: `/kalender?neu=1&kunde=${q.customerId}`, text: <>Bei {q.customerName} fehlt noch {q.visits.missing} Vor-Ort-Termin{q.visits.missing === 1 ? "" : "e"} in diesem Monat</> });
    }
  }
  for (const { i, name } of brokenConns) {
    alerts.push({ icon: <Plug />, tone: "amber", href: `/kunden/${i.customerId}?tab=anbindungen`, text: <>Anbindung bei {name} gestört: {i.lastError?.slice(0, 80)}</> });
  }
  if (missingReceipts.n > 0) {
    alerts.push({ icon: <Paperclip />, tone: "blue", href: "/ausgaben", text: <>{missingReceipts.n} Ausgabe{missingReceipts.n === 1 ? "" : "n"} ohne Beleg – kurz abfotografieren</> });
  }
  if (unread.n > 0) {
    alerts.push({ icon: <Mail />, tone: "blue", href: "/mail", text: <>{unread.n} ungelesene E-Mail{unread.n === 1 ? "" : "s"}</> });
  }

  const alertsCard = alerts.length > 0 && (
            <Card>
              <CardHeader title="Braucht Aufmerksamkeit" icon={<CircleAlert />} />
              <div className="divide-y divide-line">
                {alerts.slice(0, 10).map((a, i) => (
                  <Link key={i} href={a.href} className="flex items-start gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5",
                        a.tone === "red" && "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
                        a.tone === "amber" && "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                        a.tone === "blue" && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
                      )}
                    >
                      {a.icon}
                    </span>
                    <span className="pt-1 leading-snug text-fg-2">{a.text}</span>
                  </Link>
                ))}
              </div>
            </Card>
          );

  const missingVideos = quota.reduce((s, q) => s + q.videos.missing, 0);
  const openVideos = quota.reduce((s, q) => s + Math.max(0, q.videos.target - q.videos.delivered), 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{WEEKDAYS[dayOfWeek(today)]}, {fmtDateLong(today)}</p>
          <h1 className="mt-1 font-serif text-[38px] leading-tight font-semibold sm:text-[44px]">
            {greeting()}, {me.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted">
            {openVideos > 0 ? `Diesen Monat sind noch ${openVideos} Video${openVideos === 1 ? "" : "s"} offen` : "Alle Videos für diesen Monat sind fertig"}
            {upcoming.filter((u) => u.kind === "event").length > 0 && ` · ${upcoming.filter((u) => u.kind === "event").length} Termine in den nächsten 7 Tagen`}
            {overdueInv.length > 0 && ` · ${overdueInv.length} überfällige Rechnung${overdueInv.length === 1 ? "" : "en"}`}.
          </p>
        </div>
      </div>

      {alertsCard && <div className="mb-6 xl:hidden">{alertsCard}</div>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Einnahmen ${fmtMonth(month).split(" ")[0]} (netto)`} value={eur(thisMonth?.einnahmen ?? 0)} hint={lastMonth ? `Vormonat: ${eur(lastMonth.einnahmen)}` : undefined} icon={<TrendingUp />} />
        <Stat label="Offene Forderungen" value={eur(openInv.v)} hint={`${openInv.n} Rechnungen${overdueInv.length ? ` · ${overdueInv.length} überfällig` : ""}`} icon={<Wallet />} />
        <Stat label="Monatlich wiederkehrend" value={eur(mrr)} hint={`${activeContracts.length} aktive Verträge`} icon={<Repeat />} />
        <Stat label="Aktive Kunden" value={activeCustomers.n} icon={<Users />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader
              title={`Content-Soll ${fmtMonth(month)}`}
              description={missingVideos > 0 ? `${missingVideos} vereinbarte Video${missingVideos === 1 ? "" : "s"} sind noch nicht einmal geplant` : "Was laut Vertrag diesen Monat fällig ist"}
              icon={<Clapperboard />}
              actions={<LinkButton href="/content" size="sm">Zum Board</LinkButton>}
            />
            {quota.length === 0 ? (
              <CardBody>
                <p className="text-sm text-muted">Noch keine Verträge mit monatlichem Video-/Termin-Umfang. Tragt ihn beim Kunden unter „Verträge“ ein, dann seht ihr hier immer, bei wem noch etwas fehlt.</p>
              </CardBody>
            ) : (
              <>
                <div className="divide-y divide-line">
                  {quota.slice(0, 8).map((q) => {
                    const done = q.videos.delivered >= q.videos.target && q.visits.missing === 0 && q.posts.delivered >= q.posts.target;
                    return (
                      <Link key={q.customerId} href={`/content?kunde=${q.customerId}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-2 sm:grid-cols-[200px_1fr_auto]">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <CustomerMark name={q.customerName} color={q.customerColor} size="sm" />
                          <span className="truncate text-sm font-medium">{q.customerName}</span>
                        </span>
                        <div className="col-span-2 row-start-2 space-y-1 sm:col-span-1 sm:row-start-auto">
                          {q.videos.target > 0 && (
                            <Progress total={q.videos.target} segments={[{ value: q.videos.delivered, className: "bg-emerald-500" }, { value: q.videos.inProgress, className: "bg-amber-400" }]} />
                          )}
                          <p className="text-xs text-muted num">
                            {q.videos.target > 0 && <>{q.videos.delivered}/{q.videos.target} Videos</>}
                            {q.posts.target > 0 && <> · {q.posts.delivered}/{q.posts.target} Posts</>}
                            {q.visits.target > 0 && <> · {q.visits.done + q.visits.planned}/{q.visits.target} Termine</>}
                          </p>
                        </div>
                        <span className={cn("text-right text-xs font-medium whitespace-nowrap", done ? "text-emerald-600 dark:text-emerald-400" : q.videos.missing ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-300")}>
                          {done ? "✓ erledigt" : q.videos.missing ? `${q.videos.missing} ungeplant` : q.videos.target - q.videos.delivered > 0 ? `${q.videos.target - q.videos.delivered} in Arbeit` : "Termine offen"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-line px-5 py-3">
                  <QuotaLegend />
                </div>
              </>
            )}
          </Card>

          <Card>
            <CardHeader title="Einnahmen der letzten 12 Monate" description="netto, nach Zahlungseingang" actions={<LinkButton href="/finanzen" size="sm" variant="ghost">Auswertung <ArrowRight /></LinkButton>} />
            <CardBody>
              <ColumnChart data={chartData} xKey="month" xFormat="month" format="eur" height={220} series={[{ key: "einnahmen", name: "Einnahmen", color: "var(--chart-1)" }]} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Zuletzt passiert" />
            <div className="divide-y divide-line">
              {recent.length === 0 && <p className="px-5 py-4 text-sm text-muted">Noch nichts passiert.</p>}
              {recent.map(({ a, name, color }) => (
                <Link key={a.id} href={a.customerId ? `/kunden/${a.customerId}?tab=verlauf` : "#"} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                  {name ? <CustomerMark name={name} color={color} size="sm" /> : <span className="size-7" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{a.title}{name ? <span className="text-muted"> · {name}</span> : null}</span>
                    {a.body && <span className="block truncate text-xs text-muted">{a.body}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {fmtTimestamp(a.createdAt).split(",")[0]}
                    {a.userId && userNames[a.userId] ? ` · ${userNames[a.userId].split(" ")[0]}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {alertsCard && <div className="hidden xl:block">{alertsCard}</div>}

          <Card>
            <CardHeader title="Die nächsten 7 Tage" icon={<CalendarDays />} actions={<LinkButton href="/kalender?ansicht=woche" size="sm" variant="ghost">Kalender</LinkButton>} />
            <div className="divide-y divide-line">
              {days.map((d) => {
                const items = upcoming.filter((u) => u.date === d || (u.endDate && u.date < d && u.endDate >= d));
                if (!items.length) return null;
                return (
                  <div key={d} className="px-5 py-3">
                    <p className={cn("mb-1.5 text-xs font-semibold", d === today ? "text-accent" : "text-muted")}>
                      {d === today ? "Heute" : d === addDays(today, 1) ? "Morgen" : `${WEEKDAYS_SHORT[dayOfWeek(d)]}, ${fmtDate(d).slice(0, 6)}`}
                    </p>
                    <div className="space-y-1">
                      {items.map((it) => (
                        <Link key={it.key} href={it.href ?? `/kalender?datum=${d}&ansicht=woche`} className={cn("block truncate rounded-md border-l-[3px] px-2 py-1 text-xs", itemStyle(it))}>
                          {it.time && <span className="mr-1 font-semibold num">{it.time}</span>}
                          {it.title}
                          {it.customerName && !it.title.includes(it.customerName) && <span className="opacity-70"> · {it.customerName}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
              {upcoming.length === 0 && <p className="px-5 py-4 text-sm text-muted">Keine Termine oder Fristen.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Meine Aufgaben" icon={<ListTodo />} actions={<LinkButton href="/aufgaben" size="sm" variant="ghost">Alle</LinkButton>} />
            <div className="divide-y divide-line">
              {myTasks.length === 0 && <p className="px-5 py-4 text-sm text-muted">Nichts Dringendes 🎉</p>}
              {myTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <TaskCheck id={t.id} done={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t.title}</span>
                    {t.dueDate && (
                      <span className={cn("text-xs", t.dueDate < today ? "font-medium text-red-600 dark:text-red-400" : "text-muted")}>
                        {t.dueDate < today ? <AlarmClock className="mr-1 inline size-3" /> : null}
                        {relativeDays(diffDays(t.dueDate, today))}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {topPost[0] && topPost[0].p.views > 0 && (
            <Card>
              <CardHeader title="Top-Beitrag der letzten 30 Tage" icon={<Flame />} />
              <CardBody>
                <div className="flex items-start gap-3">
                  <PlatformIcon platform={topPost[0].p.platform} className="mt-1 size-5" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{topPost[0].p.caption || topPost[0].p.mediaType || "Beitrag"}</p>
                    <p className="text-xs text-muted">{topPost[0].name} · {fmtDate(topPost[0].p.publishedAt)}</p>
                    <p className="mt-2 text-2xl font-semibold">{fmtCompact(topPost[0].p.views)} <span className="text-sm font-normal text-muted">Aufrufe</span></p>
                    {topPost[0].p.url && (
                      <a href={topPost[0].p.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-accent hover:underline">Beitrag ansehen</a>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
