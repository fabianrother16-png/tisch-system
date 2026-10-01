import Link from "next/link";
import { and, desc, eq, gte } from "drizzle-orm";
import { Clapperboard, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { contents, users, type Customer } from "@/lib/db/schema";
import { Card, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlatformIcon } from "@/components/PlatformIcon";
import { getMonthlyQuota } from "@/lib/domain/quota";
import { CONTENT_FORMAT_MAP, CONTENT_STATUS_MAP } from "@/lib/constants";
import { addMonthKey, currentMonth, todayISO } from "@/lib/dates";
import { fmtDate, fmtMonth } from "@/lib/format";

export async function ContentTab({ customer }: { customer: Customer }) {
  const id = customer.id;
  const month = currentMonth();
  const today = todayISO();
  const history = await Promise.all(
    Array.from({ length: 6 }, (_, i) => addMonthKey(month, -5 + i)).map(async (m) => ({ month: m, quota: (await getMonthlyQuota(m, id))[0] })),
  );
  const [rows, team] = await Promise.all([
    db.select().from(contents).where(and(eq(contents.customerId, id), gte(contents.periodMonth, addMonthKey(month, -5)))).orderBy(desc(contents.periodMonth), desc(contents.updatedAt)),
    db.select({ id: users.id, name: users.name, color: users.color }).from(users),
  ]);
  const umap = new Map(team.map((u) => [u.id, u]));
  const hasQuota = history.some((h) => h.quota && h.quota.videos.target > 0);

  return (
    <div className="space-y-6">
      {hasQuota && (
        <Card>
          <CardHeader title="Lieferung der letzten 6 Monate" description="Fertige Videos im Verhältnis zum vereinbarten Umfang" />
          <div className="grid gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
            {history.map(({ month: m, quota: q }) => (
              <Link key={m} href={`/content?monat=${m}&kunde=${id}`} className="bg-surface p-4 transition-colors hover:bg-surface-2">
                <p className="text-xs font-medium text-muted">{fmtMonth(m)}</p>
                {q && q.videos.target > 0 ? (
                  <>
                    <p className="mt-1 text-xl font-semibold">
                      {q.videos.delivered}
                      <span className="text-sm font-normal text-muted"> / {q.videos.target}</span>
                    </p>
                    <Progress
                      className="mt-2"
                      total={q.videos.target}
                      segments={[
                        { value: q.videos.delivered, className: "bg-emerald-500" },
                        { value: q.videos.inProgress, className: "bg-amber-400" },
                      ]}
                    />
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted">kein Soll</p>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <CardHeader
          title="Content"
          icon={<Clapperboard />}
          description="Alles der letzten 6 Monate und geplant"
          actions={
            <>
              <LinkButton href={`/content?kunde=${id}`} size="sm">Board öffnen</LinkButton>
              <LinkButton href={`/content?neu=1&kunde=${id}`} size="sm" variant="primary"><Plus /> Content</LinkButton>
            </>
          }
        />
        {rows.length === 0 ? (
          <EmptyState icon={<Clapperboard />} title="Noch kein Content geplant" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Titel</th><th>Monat</th><th>Format</th><th>Status</th><th>Dreh</th><th>Deadline</th><th>Online</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const u = c.assigneeId ? umap.get(c.assigneeId) : null;
                  return (
                    <tr key={c.id}>
                      <td className="font-medium">{c.title}</td>
                      <td className="whitespace-nowrap text-muted">{fmtMonth(c.periodMonth)}</td>
                      <td>
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-fg-2">
                          {CONTENT_FORMAT_MAP[c.format]?.label ?? c.format}
                          {c.platforms.map((p) => <PlatformIcon key={p} platform={p} className="size-3.5" />)}
                        </span>
                      </td>
                      <td><StatusBadge value={c.status} map={CONTENT_STATUS_MAP} /></td>
                      <td className="whitespace-nowrap">{fmtDate(c.shootDate)}</td>
                      <td className={`whitespace-nowrap ${c.dueDate && c.dueDate < today && c.status !== "veroeffentlicht" ? "font-medium text-red-600" : ""}`}>{fmtDate(c.dueDate)}</td>
                      <td>{c.publishedUrl ? <a href={c.publishedUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">ansehen</a> : fmtDate(c.publishDate)}</td>
                      <td>{u && <Avatar name={u.name} color={u.color} size="sm" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
