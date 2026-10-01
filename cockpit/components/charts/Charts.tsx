"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { fmtDate, fmtDateShort, fmtMonth, fmtMonthShort, fmtNumber } from "@/lib/format";

export type Series = { key: string; name: string; color: string };
type ValueFormat = "eur" | "number" | "decimal";
/** Formatierung der x-Achse (als String, da Funktionen nicht vom Server übergeben werden können) */
export type XFormat = "none" | "month" | "day";

function xTick(v: string, f: XFormat) {
  if (f === "month") return fmtMonthShort(v);
  if (f === "day") return fmtDateShort(v);
  return v;
}
function xLabel(v: string, f: XFormat) {
  if (f === "month") return fmtMonth(v);
  if (f === "day") return fmtDate(v);
  return v;
}

const eurFmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function formatValue(v: number, f: ValueFormat) {
  if (f === "eur") return eurFmt.format(v / 100);
  if (f === "decimal") return v.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return fmtNumber(Math.round(v));
}
function shortNumber(v: number) {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Mio.`;
  if (a >= 10_000) return `${(v / 1000).toLocaleString("de-DE", { maximumFractionDigits: 0 })} Tsd.`;
  return fmtNumber(v);
}
function formatTick(v: number, f: ValueFormat) {
  if (f === "eur") {
    const euros = v / 100;
    if (Math.abs(euros) >= 100_000) return `${shortNumber(euros)} €`;
    return eurFmt.format(euros);
  }
  if (f === "decimal") return v.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return shortNumber(v);
}

export function Legend({ series, kind }: { series: Series[]; kind: "bar" | "line" }) {
  if (series.length < 2) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-2">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          {kind === "bar" ? (
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          ) : (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
          )}
          {s.name}
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  format,
  formatLabel,
  showTotal,
}: Partial<Omit<TooltipContentProps<number, string>, "labelFormatter">> & {
  series: Series[];
  format: ValueFormat;
  formatLabel?: (l: string) => string;
  showTotal?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const rows = series
    .map((s) => ({ s, v: payload.find((p) => p.dataKey === s.key)?.value as number | undefined }))
    .filter((r) => r.v != null);
  const total = rows.reduce((sum, r) => sum + (r.v ?? 0), 0);
  return (
    <div className="min-w-40 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-muted">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      <div className="space-y-1">
        {rows.map(({ s, v }) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="font-semibold text-fg num">{formatValue(v ?? 0, format)}</span>
            <span className="text-muted">{s.name}</span>
          </div>
        ))}
        {showTotal && rows.length > 1 && (
          <div className="mt-1 flex items-center gap-2 border-t border-line pt-1">
            <span className="w-3" />
            <span className="font-semibold text-fg num">{formatValue(total, format)}</span>
            <span className="text-muted">gesamt</span>
          </div>
        )}
      </div>
    </div>
  );
}

const axisProps = {
  tick: { fill: "var(--chart-axis)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

/** Säulendiagramm (gruppiert oder gestapelt) mit einer gemeinsamen y-Achse */
export function ColumnChart({
  data,
  xKey,
  series,
  format = "number",
  stacked,
  height = 260,
  xFormat = "none",
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  format?: ValueFormat;
  stacked?: boolean;
  height?: number;
  xFormat?: XFormat;
}) {
  return (
    <div>
      <Legend series={series} kind="bar" />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey={xKey} {...axisProps} tickFormatter={(v: string) => xTick(String(v), xFormat)} interval="preserveStartEnd" minTickGap={8} />
          <YAxis {...axisProps} width={format === "eur" ? 80 : 68} tickFormatter={(v: number) => formatTick(v, format)} />
          <Tooltip
            cursor={{ fill: "var(--surface-3)", opacity: 0.6 }}
            content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} series={series} format={format} formatLabel={(l: string) => xLabel(l, xFormat)} showTotal={stacked} />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              maxBarSize={24}
              stackId={stacked ? "a" : undefined}
              radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : 0}
              stroke={stacked ? "var(--surface)" : undefined}
              strokeWidth={stacked ? 1 : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Linien-/Verlaufsdiagramm mit Fadenkreuz-Tooltip */
export function TrendChart({
  data,
  xKey,
  series,
  format = "number",
  height = 260,
  xFormat = "none",
  area,
  domainMin,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  format?: ValueFormat;
  height?: number;
  xFormat?: XFormat;
  area?: boolean;
  domainMin?: "auto" | number;
}) {
  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
      <XAxis dataKey={xKey} {...axisProps} tickFormatter={(v: string) => xTick(String(v), xFormat)} interval="preserveStartEnd" minTickGap={24} />
      <YAxis {...axisProps} width={format === "eur" ? 80 : 68} tickFormatter={(v: number) => formatTick(v, format)} domain={[domainMin ?? 0, "auto"]} allowDecimals={format === "decimal"} />
      <Tooltip
        cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
        content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} series={series} format={format} formatLabel={(l: string) => xLabel(l, xFormat)} />}
      />
    </>
  );
  return (
    <div>
      <Legend series={series} kind="line" />
      <ResponsiveContainer width="100%" height={height}>
        {area ? (
          <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            {common}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={s.color}
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            {common}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
