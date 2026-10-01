import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Clapperboard, Plus, Wand2 } from "lucide-react";
import { db } from "@/lib/db";
import { contents, customers, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { CustomerMark, Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Tabs";
import { ActionButton } from "@/components/ui/form";
import { ContentForm } from "@/components/content/ContentForm";
import { ContentBoard, type BoardItem } from "@/components/content/ContentBoard";
import { QuotaLegend } from "@/components/customers/QuotaBars";
import { PlatformIcon } from "@/components/PlatformIcon";
import { fillQuota, saveContent } from "@/lib/actions/content";
import { getMonthlyQuota } from "@/lib/domain/quota";
import { CONTENT_FORMAT_MAP, CONTENT_STATUS_MAP } from "@/lib/constants";
import { addMonthKey, currentMonth, todayISO } from "@/lib/dates";
import { fmtDate, fmtMonth } from "@/lib/format";

export const metadata = { title: "Content" };

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string; kunde?: string; person?: string; ansicht?: string; neu?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.monat ?? "") ? sp.monat! : currentMonth();
  const customerId = sp.kunde ? Number(sp.kunde) : undefined;
  const personId = sp.person ? Number(sp.person) : undefined;
  const view = sp.ansicht === "liste" ? "liste" : "board";
  const today = todayISO();

  const [customerRows, team, quota] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(inArray(customers.status, ["aktiv", "lead", "pausiert"]))
      .orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name, color: users.color }).from(users).where(eq(users.active, true)),
    getMonthlyQuota(month),
  ]);

  const rows = await db
    .select({ content: contents, customer: customers })
    .from(contents)
    .innerJoin(customers, eq(customers.id, contents.customerId))
    .where(
      and(
        eq(contents.periodMonth, month),
        customerId ? eq(contents.customerId, customerId) : undefined,
        personId ? eq(contents.assigneeId, personId) : undefined,
      ),
    )
    .orderBy(asc(contents.dueDate), asc(contents.createdAt));

  const userMap = new Map(team.map((u) => [u.id, u]));
  const items: BoardItem[] = rows.map(({ content, customer }) => ({
    ...content,
    customerName: customer.name,
    customerColor: customer.color,
    assigneeName: content.assigneeId ? userMap.get(content.assigneeId)?.name ?? null : null,
    assigneeColor: content.assigneeId ? userMap.get(content.assigneeId)?.color ?? null : null,
  }));

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { monat: month, kunde: sp.kunde, person: sp.person, ansicht: sp.ansicht, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/content?${p.toString()}`;
  };

  const customerOptions = customerRows.map((c) => ({ id: c.id, name: c.name }));
  const userOptions = team.map((u) => ({ id: u.id, name: u.name }));
  const visibleQuota = customerId ? quota.filter((q) => q.customerId === customerId) : quota;
  const totalMissing = visibleQuota.reduce((s, q) => s + q.videos.missing, 0);

  return (
    <>
      <PageHeader
        title="Content-Produktion"
        description="Von der Idee bis zum veröffentlichten Video – und was jedem Kunden diesen Monat noch fehlt."
        actions={
          <Modal
            title="Neuer Content"
            size="lg"
            defaultOpen={sp.neu === "1"}
            trigger={
              <Button>
                <Plus /> Neuer Content
              </Button>
            }
          >
            <ContentForm
              action={saveContent.bind(null, null)}
              customers={customerOptions}
              users={userOptions}
              defaults={{ customerId, periodMonth: month }}
            />
          </Modal>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <LinkButton href={qs({ monat: addMonthKey(month, -1) })} size="icon" aria-label="Vormonat">
            <ChevronLeft />
          </LinkButton>
          <span className="min-w-36 text-center font-semibold">{fmtMonth(month)}</span>
          <LinkButton href={qs({ monat: addMonthKey(month, 1) })} size="icon" aria-label="Nächster Monat">
            <ChevronRight />
          </LinkButton>
          {month !== currentMonth() && (
            <LinkButton href={qs({ monat: currentMonth() })} size="sm" variant="ghost">
              Heute
            </LinkButton>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex flex-wrap gap-2" action="/content">
            <input type="hidden" name="monat" value={month} />
            {sp.ansicht && <input type="hidden" name="ansicht" value={sp.ansicht} />}
            <select name="kunde" defaultValue={sp.kunde ?? ""} className="input w-auto py-1.5 text-sm" aria-label="Kunde">
              <option value="">Alle Kunden</option>
              {customerRows.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="person" defaultValue={sp.person ?? ""} className="input w-auto py-1.5 text-sm" aria-label="Person">
              <option value="">Alle Personen</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="md">Filtern</Button>
          </form>
          <Segmented
            active={view}
            items={[
              { key: "board", label: "Board", href: qs({ ansicht: undefined }) },
              { key: "liste", label: "Liste", href: qs({ ansicht: "liste" }) },
            ]}
          />
        </div>
      </div>

      {visibleQuota.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader
            title={`Soll im ${fmtMonth(month)}`}
            description={totalMissing > 0 ? `Es fehlen noch ${totalMissing} Video${totalMissing === 1 ? "" : "s"}, die noch nicht einmal geplant sind.` : "Alle vereinbarten Videos sind geplant oder fertig."}
            actions={<QuotaLegend />}
          />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th className="min-w-48">Videos</th>
                  <th className="min-w-40">Beiträge</th>
                  <th className="min-w-40">Vor-Ort-Termine</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleQuota.map((q) => (
                  <tr key={q.customerId}>
                    <td>
                      <Link href={`/kunden/${q.customerId}`} className="flex items-center gap-2 font-medium hover:text-accent">
                        <CustomerMark name={q.customerName} color={q.customerColor} size="sm" />
                        {q.customerName}
                      </Link>
                    </td>
                    {[
                      { t: q.videos.target, a: q.videos.delivered, b: q.videos.inProgress, m: q.videos.missing },
                      { t: q.posts.target, a: q.posts.delivered, b: q.posts.inProgress, m: q.posts.missing },
                      { t: q.visits.target, a: q.visits.done, b: q.visits.planned, m: q.visits.missing },
                    ].map((x, i) => (
                      <td key={i}>
                        {x.t > 0 ? (
                          <div className="space-y-1">
                            <Progress total={x.t} segments={[{ value: x.a, className: "bg-emerald-500" }, { value: x.b, className: "bg-amber-400" }]} />
                            <p className="text-xs text-muted num">
                              {x.a}/{x.t}
                              {x.m > 0 && <span className="font-medium text-red-600 dark:text-red-400"> · {x.m} fehlen</span>}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">–</span>
                        )}
                      </td>
                    ))}
                    <td className="text-right">
                      {q.videos.missing > 0 && (
                        <ActionButton action={fillQuota.bind(null, q.customerId, month, q.videos.missing)} title="Fehlende Videos als Karten anlegen">
                          <Wand2 /> {q.videos.missing} einplanen
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <Clapperboard className="mb-3 size-8 text-muted" />
          <p className="font-medium">Für {fmtMonth(month)} ist noch nichts geplant</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Legt Content-Ideen an oder nutzt „einplanen“ oben, um die vertraglich vereinbarten Videos automatisch als Karten zu erstellen.
          </p>
        </Card>
      ) : view === "board" ? (
        <ContentBoard items={items} customers={customerOptions} users={userOptions} month={month} today={today} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Kunde</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Dreh</th>
                  <th>Deadline</th>
                  <th>Online</th>
                  <th>Zuständig</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="font-medium">{i.title}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <CustomerMark name={i.customerName} color={i.customerColor} size="sm" />
                        {i.customerName}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-fg-2">
                        {CONTENT_FORMAT_MAP[i.format]?.label ?? i.format}
                        {i.platforms.map((p) => <PlatformIcon key={p} platform={p} className="size-3.5" />)}
                      </span>
                    </td>
                    <td><StatusBadge value={i.status} map={CONTENT_STATUS_MAP} /></td>
                    <td>{fmtDate(i.shootDate)}</td>
                    <td className={i.dueDate && i.dueDate < today && i.status !== "veroeffentlicht" ? "font-medium text-red-600" : ""}>{fmtDate(i.dueDate)}</td>
                    <td>{i.publishedUrl ? <a href={i.publishedUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">ansehen</a> : fmtDate(i.publishDate)}</td>
                    <td>{i.assigneeName ? <Avatar name={i.assigneeName} color={i.assigneeColor} size="sm" /> : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
