import { ArrowRight, Eye, Heart, Link2, MousePointerClick, Percent, Clapperboard, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { ColumnChart, TrendChart } from "@/components/charts/Charts";
import { PLATFORM_ORDER, PLATFORM_SERIES } from "@/components/charts/palette";
import { SnapshotTiles } from "@/components/customers/SnapshotTiles";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { PerformanceData } from "@/lib/domain/report";
import { fmtCompact, fmtDecimal, fmtNumber, fmtPercent, fmtRate, pctChange } from "@/lib/format";
import { PostsTable } from "./PostsTable";

export function PerformanceDashboard({ data, editable, today, audience = "intern" }: { data: PerformanceData; editable?: boolean; today: string; audience?: "intern" | "kunde" }) {
  const d = data;
  const viewsSeries = PLATFORM_ORDER.filter((p) => d.monthly.some((m) => (m[p] as number) > 0)).map((p) => ({ key: p, name: PLATFORM_SERIES[p].label, color: PLATFORM_SERIES[p].color }));
  const followerSeries = PLATFORM_ORDER.filter((p) => d.followerKeys.includes(p)).map((p) => ({ key: p, name: PLATFORM_SERIES[p].label, color: PLATFORM_SERIES[p].color }));
  const hasPosts = d.totals.count > 0 || d.totalsPrev.count > 0;
  const hasViewsHistory = viewsSeries.length > 0;
  const rangeLabel = `letzte ${d.range.days >= 365 ? "12 Monate" : d.range.days >= 180 ? "6 Monate" : `${d.range.days} Tage`}`;

  const empty = !hasPosts && !hasViewsHistory && !d.snapshot.length && !d.hasGoogle && !d.linkTotal && !d.ads.spend;
  if (empty) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <Sparkles className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Noch keine Zahlen vorhanden</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {audience === "kunde"
              ? "Sobald die ersten Auswertungen vorliegen, erscheinen sie hier automatisch."
              : "Verbindet unter „Anbindungen & Report“ die Kanäle des Kunden oder erfasst Beiträge und Kennzahlen manuell."}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {hasPosts && audience === "kunde" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Interaktionen" value={fmtCompact(d.totals.interactions)} change={pctChange(d.totals.interactions, d.totalsPrev.interactions)} hint="vs. Vorperiode" icon={<Heart />} />
          <Stat label="Engagement-Rate" value={fmtRate(d.totals.engagementRate, 1)} hint="Likes, Kommentare, Shares & Saves je Aufruf" icon={<Percent />} />
          <Stat label="Ø Aufrufe pro Beitrag" value={fmtCompact(d.totals.avgViews)} change={pctChange(d.totals.avgViews, d.totalsPrev.avgViews)} hint="vs. Vorperiode" icon={<Eye />} />
        </div>
      )}
      {hasPosts && audience === "intern" && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={`Aufrufe (${rangeLabel})`} value={fmtCompact(d.totals.views)} change={pctChange(d.totals.views, d.totalsPrev.views)} hint="vs. Vorperiode" icon={<Eye />} />
          <Stat label="Interaktionen" value={fmtCompact(d.totals.interactions)} change={pctChange(d.totals.interactions, d.totalsPrev.interactions)} hint="Likes, Kommentare, Shares, Saves" icon={<Heart />} />
          <Stat label="Engagement-Rate" value={fmtRate(d.totals.engagementRate, 1)} hint="Interaktionen / Aufrufe" icon={<Percent />} />
          <Stat label="Veröffentlichte Beiträge" value={d.totals.count} hint={`Ø ${fmtCompact(d.totals.avgViews)} Aufrufe pro Beitrag`} icon={<Clapperboard />} />
        </div>
      )}

      {d.snapshot.length > 0 && <SnapshotTiles items={d.snapshot.filter((s) => !(s.platform === "all" && hasPosts))} />}

      {(hasViewsHistory || followerSeries.length > 0) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {hasViewsHistory && (
            <Card>
              <CardHeader title="Aufrufe pro Monat" description="Summe der Aufrufe aller im Monat veröffentlichten Beiträge" />
              <CardBody>
                <ColumnChart data={d.monthly} xKey="month" xFormat="month" series={viewsSeries} stacked />
              </CardBody>
            </Card>
          )}
          {followerSeries.length > 0 && (
            <Card>
              <CardHeader title="Follower-Entwicklung" description={rangeLabel} />
              <CardBody>
                <TrendChart data={d.followers} xKey="date" xFormat="day" series={followerSeries} domainMin="auto" />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {(d.hasGoogle || d.hasReviews) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {d.hasGoogle && (
            <Card>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-2">
                    <PlatformIcon platform="google" /> Aktionen im Google-Unternehmensprofil
                  </span>
                }
                description="Wie oft Kunden über Google aktiv geworden sind"
              />
              <CardBody>
                <ColumnChart
                  data={d.google}
                  xKey="month"
                  xFormat="month"
                  stacked
                  series={[
                    { key: "website_clicks", name: "Website-Klicks", color: "var(--chart-1)" },
                    { key: "call_clicks", name: "Anrufe", color: "var(--chart-2)" },
                    { key: "direction_requests", name: "Routenanfragen", color: "var(--chart-3)" },
                  ]}
                />
              </CardBody>
            </Card>
          )}
          {d.hasReviews && (
            <Card>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-2">
                    <PlatformIcon platform="google" /> Google-Bewertungen
                  </span>
                }
                description="Anzahl der Bewertungen und Sterne-Durchschnitt"
              />
              <CardBody className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted">Anzahl Bewertungen</p>
                  <TrendChart data={d.reviews} xKey="month" xFormat="month" height={150} domainMin="auto" series={[{ key: "review_count", name: "Bewertungen", color: "var(--chart-1)" }]} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted">Sterne (Durchschnitt)</p>
                  <TrendChart data={d.reviews} xKey="month" xFormat="month" height={130} format="decimal" domainMin="auto" series={[{ key: "rating", name: "Sterne", color: "var(--chart-4)" }]} />
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {(d.linkTotal > 0 || d.linkPrev > 0 || d.ads.spend > 0) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {(d.linkTotal > 0 || d.linkPrev > 0) && (
            <Card>
              <CardHeader
                title={<span className="inline-flex items-center gap-2"><Link2 className="size-4" /> Klicks auf Tracking-Links & NFC-Karten</span>}
                description={`${fmtNumber(d.linkTotal)} Klicks · ${fmtPercent(pctChange(d.linkTotal, d.linkPrev))} vs. Vorperiode`}
              />
              <CardBody>
                <TrendChart data={d.linkDaily} xKey="date" xFormat="day" area height={200} series={[{ key: "n", name: "Klicks", color: "var(--chart-1)" }]} />
              </CardBody>
            </Card>
          )}
          {d.ads.spend > 0 && (
            <Card>
              <CardHeader title={<span className="inline-flex items-center gap-2"><MousePointerClick className="size-4" /> Werbeanzeigen</span>} description={rangeLabel} />
              <CardBody>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    ["Budget eingesetzt", new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(d.ads.spend / 100)],
                    ["Impressionen", fmtCompact(d.ads.impressions)],
                    ["Klicks", fmtNumber(d.ads.clicks)],
                    ["Klickrate (CTR)", fmtRate(d.ads.ctr, 2)],
                    ["Kosten pro Klick", d.ads.cpc != null ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(d.ads.cpc / 100) : "–"],
                    ["Leads / Conversions", fmtDecimal(d.ads.conversions)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="mt-0.5 text-lg font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {d.beforeAfter.length > 0 && (
        <Card>
          <CardHeader title="Vorher → Nachher" description="Ausgangswerte vor Beginn der Zusammenarbeit im Vergleich zu heute (bzw. Ø der letzten 3 Monate)" />
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {d.beforeAfter.map((b) => {
              const isRating = b.metric === "rating";
              const f = (v: number) => (isRating ? fmtDecimal(v) : fmtNumber(Math.round(v)));
              const change = b.after != null ? pctChange(b.after, b.before) : null;
              return (
                <div key={`${b.platform}-${b.metric}`} className="bg-surface p-5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <PlatformIcon platform={b.platform} className="size-3.5" />
                    {b.label}
                    {b.kind === "zeitraum" && " / Monat"}
                  </p>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-lg text-muted line-through decoration-1">{f(b.before)}</span>
                    <ArrowRight className="size-4 self-center text-muted" />
                    <span className="text-2xl font-semibold">{b.after != null ? f(b.after) : "–"}</span>
                  </div>
                  {change != null && Number.isFinite(change) && (
                    <p className={`mt-1 text-sm font-medium ${change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{fmtPercent(change, 0)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {d.top.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader title="Top-Beiträge" description={`Die erfolgreichsten Beiträge (${rangeLabel}), sortiert nach Aufrufen`} />
          <PostsTable posts={d.top} editable={editable} today={today} viralThreshold={d.viralThreshold} />
        </Card>
      )}
    </div>
  );
}
