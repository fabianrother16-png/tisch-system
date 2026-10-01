import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "./cn";
import { fmtPercent } from "@/lib/format";

export function Stat({
  label,
  value,
  hint,
  change,
  icon,
  className,
  invert,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  change?: number | null;
  icon?: React.ReactNode;
  className?: string;
  /** true, wenn ein Rückgang positiv ist (z. B. Kosten pro Klick) */
  invert?: boolean;
}) {
  const positive = change != null && (invert ? change < 0 : change > 0);
  const negative = change != null && (invert ? change > 0 : change < 0);
  return (
    <div className={cn("card p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</p>
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {change != null && Number.isFinite(change) && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium whitespace-nowrap",
              positive && "text-emerald-600 dark:text-emerald-400",
              negative && "text-red-600 dark:text-red-400",
              !positive && !negative && "text-muted",
            )}
          >
            {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {fmtPercent(change)}
          </span>
        )}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </div>
  );
}
