import { cn } from "./cn";

/** Segmentierter Fortschrittsbalken (z. B. geliefert / in Arbeit / offen) */
export function Progress({
  segments,
  total,
  className,
}: {
  segments: { value: number; className: string }[];
  total: number;
  className?: string;
}) {
  const max = Math.max(total, segments.reduce((s, x) => s + x.value, 0), 1);
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      {segments.map((s, i) =>
        s.value > 0 ? (
          <div key={i} className={cn("h-full", s.className)} style={{ width: `${(s.value / max) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}
