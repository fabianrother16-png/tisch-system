import Link from "next/link";
import { inArray } from "drizzle-orm";
import { Eye, Heart, Link2, RefreshCw, Coins, Star } from "lucide-react";
import { db } from "@/lib/db";
import { customers, integrations } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { Segmented } from "@/components/ui/Tabs";
import { ActionButton } from "@/components/ui/form";
import { PostsTable } from "@/components/performance/PostsTable";
import { syncEverything } from "@/lib/actions/performance";
import { adTotals, latestMetric, linkClicksInRange, postsInRange, postTotals, previousRange, RANGE_OPTIONS, resolveRange, sumMetric } from "@/lib/domain/performance";
import { addDays, todayISO } from "@/lib/dates";
import { eur, fmtCompact, fmtDecimal, fmtNumber, fmtPercent, pctChange } from "@/lib/format";

export const metadata = { title: "Performance" };

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ zeitraum?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const range = resolveRange(sp.zeitraum ?? "30");
  const prev = previousRange(range);
  const today = todayISO();
  const active = await db.select().from(customers).where(inArray(customers.status, ["aktiv", "pausiert"]));
  const ids = active.map((c) => c.id);
  const [cur, old, links, linksPrev, ads, conns] = await Promise.all([
    ids.length ? postsInRange(ids, range) : [],
    ids.length ? postsInRange(ids, prev) : [],
    linkClicksInRange(null, range),
    linkClicksInRange(null, prev),
    adTotals(null, range),
    db.select().from(integrations),
  ]);
  const t = postTotals(cur);
  const tp = postTotals(old);

  const rows = await Promise.all(
    active.map(async (c) => {
      const mine = cur.filter((p) => p.customerId === c.id);
      const minePrev = old.filter((p) => p.customerId === c.id);
      let followers = 0;
      let followersBefore = 0;
      for (const p of ["instagram", "tiktok", "facebook", "youtube"]) {
        const l = await latestMetric(c.id, p, "followers");
        const b = await latestMetric(c.id, p, "followers", addDays(today, -range.days));
        followers += l?.value ?? 0;
        followersBefore += b?.value ?? l?.value ?? 0;
      }
      const rating = await latestMetric(c.id, "google", "rating");
      const reviews = await latestMetric(c.id, "google", "review_count");
      const gClicks = await sumMetric(c.id, "google", "website_clicks", range);
      const lClicks = await linkClicksInRange(c.id, range);
      const cConns = conns.filter((x) => x.customerId === c.id);
      return {
        c,
        views: postTotals(mine).views,
        viewsPrev: postTotals(minePrev).views,
        posts: mine.length,
        followers,
        followerGrowth: followers - followersBefore,
        rating: rating?.value ?? null,
        reviews: reviews?.value ?? null,
        gClicks,
        lClicks,
        conns: cConns.length,
        errors: cConns.filter((x) => x.status === "fehler").length,
      };
    }),
  );
  rows.sort((a, b) => b.views - a.views || b.followers - a.followers);
  const cmap = new Map(active.map((c) => [c.id, { name: c.name, color: c.color }]));
  const top = [...cur].sort((a, b) => b.views - a.views).slice(0, 15);

  return (
    <>
      <PageHeader
        title="Performance"
        description="Wie laufen die Kanäle eurer Kunden? Alle Zahlen auf einen Blick – Details beim jeweiligen Kunden."
        actions={
          <ActionButton action={syncEverything} size="md">
            <RefreshCw /> Alle Anbindungen aktualisieren
          </ActionButton>
        }
      />
      <div className="mb-5">
        <Segmented active={range.key} items={RANGE_OPTIONS.map((o) => ({ key: o.key, label: o.label, href: `/performance?zeitraum=${o.key}` }))} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aufrufe aller Kunden" value={fmtCompact(t.views)} change={pctChange(t.views, tp.views)} hint={`${t.count} Beiträge`} icon={<Eye />} />
        <Stat label="Interaktionen" value={fmtCompact(t.interactions)} change={pctChange(t.interactions, tp.interactions)} icon={<Heart />} />
        <Stat label="Klicks über Tracking-Links" value={fmtNumber(links)} change={pctChange(links, linksPrev)} icon={<Link2 />} />
        <Stat label="Betreutes Werbebudget" value={eur(ads.spend)} hint={`${fmtNumber(ads.clicks)} Klicks`} icon={<Coins />} />
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader title="Kunden im Überblick" description="Sortiert nach Aufrufen im Zeitraum" />
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kunde</th>
                <th className="text-right">Aufrufe</th>
                <th className="text-right">vs. davor</th>
                <th className="text-right">Beiträge</th>
                <th className="text-right">Follower</th>
                <th className="text-right">Zuwachs</th>
                <th className="text-right">Google ★</th>
                <th className="text-right">Google-Klicks</th>
                <th className="text-right">Link-Klicks</th>
                <th>Anbindung</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ch = pctChange(r.views, r.viewsPrev);
                return (
                  <tr key={r.c.id} className="row-link relative">
                    <td>
                      <Link href={`/kunden/${r.c.id}?tab=performance`} className="flex items-center gap-2 font-medium after:absolute after:inset-0">
                        <CustomerMark name={r.c.name} color={r.c.color} size="sm" />
                        {r.c.name}
                      </Link>
                    </td>
                    <td className="text-right font-semibold num">{r.views ? fmtCompact(r.views) : "–"}</td>
                    <td className={`text-right num ${ch != null && ch > 0 ? "text-emerald-600 dark:text-emerald-400" : ch != null && ch < 0 ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
                      {r.views || r.viewsPrev ? fmtPercent(ch, 0) : "–"}
                    </td>
                    <td className="text-right num">{r.posts || "–"}</td>
                    <td className="text-right num">{r.followers ? fmtCompact(r.followers) : "–"}</td>
                    <td className="text-right num">{r.followerGrowth ? `${r.followerGrowth > 0 ? "+" : ""}${fmtNumber(r.followerGrowth)}` : "–"}</td>
                    <td className="text-right whitespace-nowrap num">
                      {r.rating != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {fmtDecimal(r.rating)} <span className="text-xs text-muted">({fmtNumber(r.reviews ?? 0)})</span>
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="text-right num">{r.gClicks ? fmtNumber(r.gClicks) : "–"}</td>
                    <td className="text-right num">{r.lClicks ? fmtNumber(r.lClicks) : "–"}</td>
                    <td>
                      {r.errors ? <Badge tone="red">Fehler</Badge> : r.conns ? <Badge tone="green" dot>{r.conns} aktiv</Badge> : <Badge>manuell</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {top.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader title="Top-Beiträge über alle Kunden" description="Was ist viral gegangen? Sortiert nach Aufrufen" />
          <PostsTable posts={top} today={today} customers={cmap} viralThreshold={t.avgViews ? Math.max(t.avgViews * 3, 1000) : undefined} />
        </Card>
      )}
    </>
  );
}
