import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { BarChart3, Coins, MousePointerClick, Plus, Target, Trash2, Eye, Percent } from "lucide-react";
import { db } from "@/lib/db";
import { adCampaigns, adStatsDaily, contracts, type Customer } from "@/lib/db/schema";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/ui/form";
import { TrendChart } from "@/components/charts/Charts";
import { PlatformIcon } from "@/components/PlatformIcon";
import { AdStatsForm, CampaignForm } from "@/components/performance/CampaignForm";
import { deleteCampaign, saveAdStats, saveCampaign } from "@/lib/actions/performance";
import { adDaily, adTotals, previousRange, RANGE_OPTIONS, resolveRange } from "@/lib/domain/performance";
import { AD_PLATFORM_MAP } from "@/lib/constants";
import { eachDay, todayISO } from "@/lib/dates";
import { eur, fmtCompact, fmtDecimal, fmtNumber, fmtRate, pctChange } from "@/lib/format";

export async function AdsTab({ customer, range: rangeKey }: { customer: Customer; range?: string }) {
  const id = customer.id;
  const today = todayISO();
  const range = resolveRange(rangeKey);
  const prev = previousRange(range);
  const [totals, totalsPrev, daily, campaigns, perCampaign, activeContracts] = await Promise.all([
    adTotals(id, range),
    adTotals(id, prev),
    adDaily(id, range),
    db.select().from(adCampaigns).where(eq(adCampaigns.customerId, id)).orderBy(desc(adCampaigns.createdAt)),
    db
      .select({
        campaignId: adStatsDaily.campaignId,
        spend: sql<number>`sum(${adStatsDaily.spend})`,
        impressions: sql<number>`sum(${adStatsDaily.impressions})`,
        clicks: sql<number>`sum(${adStatsDaily.clicks})`,
        conversions: sql<number>`sum(${adStatsDaily.conversions})`,
      })
      .from(adStatsDaily)
      .innerJoin(adCampaigns, eq(adCampaigns.id, adStatsDaily.campaignId))
      .where(and(eq(adCampaigns.customerId, id), gte(adStatsDaily.date, range.from), lte(adStatsDaily.date, range.to)))
      .groupBy(adStatsDaily.campaignId),
    db.select({ budget: contracts.adBudgetMonthly }).from(contracts).where(and(eq(contracts.customerId, id), eq(contracts.status, "aktiv"))),
  ]);
  const budget = activeContracts.reduce((s, c) => s + c.budget, 0);
  const byDay = new Map<string, { date: string; spend: number; clicks: number }>();
  for (const day of eachDay(range.from, range.to)) byDay.set(day, { date: day, spend: 0, clicks: 0 });
  for (const r of daily) {
    const row = byDay.get(r.date);
    if (row) {
      row.spend += Number(r.spend);
      row.clicks += Number(r.clicks);
    }
  }
  const chartData = [...byDay.values()];
  // Der heutige Tag ist meist noch nicht synchronisiert – nicht als „0“ anzeigen
  if (chartData.length && chartData[chartData.length - 1].date === today && !chartData[chartData.length - 1].spend) chartData.pop();
  const statsMap = new Map(perCampaign.map((p) => [p.campaignId, p]));
  const newCampaign = (
    <Modal title="Kampagne anlegen" size="lg" trigger={<Button><Plus /> Kampagne</Button>}>
      <CampaignForm action={saveCampaign.bind(null, id, null)} today={today} />
    </Modal>
  );

  if (!campaigns.length) {
    return (
      <Card>
        <EmptyState
          icon={<Target />}
          title="Noch keine Werbekampagnen"
          description="Verbindet Meta Ads oder Google Ads unter „Anbindungen & Report“ – oder legt Kampagnen an und tragt die Zahlen manuell ein."
          action={newCampaign}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented active={range.key} items={RANGE_OPTIONS.map((o) => ({ key: o.key, label: o.label, href: `/kunden/${id}?tab=werbung&zeitraum=${o.key}` }))} />
        {newCampaign}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Ausgaben" value={eur(totals.spend)} change={pctChange(totals.spend, totalsPrev.spend)} hint={budget ? `Budget ${eur(budget)}/Monat` : undefined} icon={<Coins />} />
        <Stat label="Impressionen" value={fmtCompact(totals.impressions)} change={pctChange(totals.impressions, totalsPrev.impressions)} icon={<Eye />} />
        <Stat label="Klicks" value={fmtNumber(totals.clicks)} change={pctChange(totals.clicks, totalsPrev.clicks)} icon={<MousePointerClick />} />
        <Stat label="Klickrate (CTR)" value={fmtRate(totals.ctr, 2)} icon={<Percent />} />
        <Stat label="Kosten pro Klick" value={totals.cpc != null ? eur(totals.cpc) : "–"} change={totals.cpc != null && totalsPrev.cpc != null ? pctChange(totals.cpc, totalsPrev.cpc) : null} invert />
        <Stat label="Leads / Conversions" value={fmtDecimal(totals.conversions)} hint={totals.cpa != null ? `${eur(totals.cpa)} pro Lead` : undefined} icon={<Target />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Ausgaben pro Tag" />
          <CardBody>
            <TrendChart data={chartData} xKey="date" xFormat="day" format="eur" area height={220} series={[{ key: "spend", name: "Ausgaben", color: "var(--chart-1)" }]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Klicks pro Tag" />
          <CardBody>
            <TrendChart data={chartData} xKey="date" xFormat="day" area height={220} series={[{ key: "clicks", name: "Klicks", color: "var(--chart-2)" }]} />
          </CardBody>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <CardHeader title="Kampagnen" icon={<BarChart3 />} description="Werte im gewählten Zeitraum" />
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kampagne</th>
                <th>Status</th>
                <th className="text-right">Ausgaben</th>
                <th className="text-right">Impr.</th>
                <th className="text-right">Klicks</th>
                <th className="text-right">CTR</th>
                <th className="text-right">CPC</th>
                <th className="text-right">Conv.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const s = statsMap.get(c.id);
                const spend = Number(s?.spend ?? 0);
                const clicks = Number(s?.clicks ?? 0);
                const impr = Number(s?.impressions ?? 0);
                return (
                  <tr key={c.id} className="group">
                    <td>
                      <span className="flex items-center gap-2">
                        <PlatformIcon platform={c.platform === "meta" ? "meta" : c.platform} />
                        <span>
                          <span className="block font-medium">{c.name}</span>
                          <span className="block text-xs text-muted">
                            {AD_PLATFORM_MAP[c.platform]?.label ?? c.platform}
                            {c.objective ? ` · ${c.objective}` : ""}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Badge tone={c.status === "aktiv" ? "green" : "neutral"}>{c.status}</Badge>
                        <Badge tone={c.source === "api" ? "blue" : "neutral"}>{c.source === "api" ? "automatisch" : "manuell"}</Badge>
                      </div>
                    </td>
                    <td className="text-right num">{eur(spend)}</td>
                    <td className="text-right num">{fmtCompact(impr)}</td>
                    <td className="text-right num">{fmtNumber(clicks)}</td>
                    <td className="text-right num">{fmtRate(impr ? (clicks / impr) * 100 : null, 2)}</td>
                    <td className="text-right num">{clicks ? eur(spend / clicks) : "–"}</td>
                    <td className="text-right num">{fmtDecimal(Number(s?.conversions ?? 0))}</td>
                    <td className="text-right whitespace-nowrap">
                      <span className="inline-flex sm:opacity-0 sm:group-hover:opacity-100">
                        {c.source === "manuell" && (
                          <Modal title={`Zahlen: ${c.name}`} trigger={<Button size="sm" variant="ghost">Zahlen</Button>}>
                            <AdStatsForm action={saveAdStats.bind(null, id, c.id)} today={today} />
                          </Modal>
                        )}
                        <ActionButton action={deleteCampaign.bind(null, id, c.id)} confirm="Kampagne inkl. Zahlen löschen?" variant="ghost" title="Löschen">
                          <Trash2 />
                        </ActionButton>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
