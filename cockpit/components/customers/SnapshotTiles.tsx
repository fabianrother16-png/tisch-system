import { ArrowDownRight, ArrowUpRight, Star } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { SnapshotItem } from "@/lib/domain/performance";
import { fmtDecimal, fmtNumber, fmtPercent, pctChange } from "@/lib/format";
import { cn } from "@/components/ui/cn";

function fmt(item: SnapshotItem, v: number) {
  return item.format === "rating" ? fmtDecimal(v) : fmtNumber(Math.round(v));
}

export function SnapshotTiles({ items, columns = 4 }: { items: SnapshotItem[]; columns?: 3 | 4 }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {items.map((item) => {
        const change = item.previous != null ? pctChange(item.value, item.previous) : null;
        const sinceStart = item.baseline != null ? item.value - item.baseline : null;
        return (
          <div key={`${item.platform}-${item.metric}`} className="card p-4">
            <div className="flex min-h-8 items-center gap-2 text-xs font-medium text-muted">
              {item.platform === "google" && item.metric === "rating" ? (
                <Star className="size-4 fill-amber-400 text-amber-400" />
              ) : ["instagram", "tiktok", "facebook", "google", "youtube"].includes(item.platform) ? (
                <PlatformIcon platform={item.platform} />
              ) : null}
              <span className="leading-tight">{item.label}</span>
            </div>
            <p className="num mt-2 text-2xl font-semibold tracking-tight">{fmt(item, item.value)}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              {change != null && Number.isFinite(change) && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    change > 0 ? "text-emerald-600 dark:text-emerald-400" : change < 0 ? "text-red-600 dark:text-red-400" : "text-muted",
                  )}
                >
                  {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {fmtPercent(change)}
                  <span className="font-normal text-muted">vs. Vormonat</span>
                </span>
              )}
              {sinceStart != null && (
                <span className="text-muted">
                  {sinceStart >= 0 ? "+" : ""}
                  {fmt(item, sinceStart)} seit Start
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
