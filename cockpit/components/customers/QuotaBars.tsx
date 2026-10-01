import { Progress } from "@/components/ui/Progress";
import type { QuotaRow } from "@/lib/domain/quota";

function Line({
  label,
  target,
  done,
  progress,
  doneLabel,
  progressLabel,
}: {
  label: string;
  target: number;
  done: number;
  progress: number;
  doneLabel: string;
  progressLabel: string;
}) {
  if (!target) return null;
  const missing = Math.max(0, target - done - progress);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-fg-2">{label}</span>
        <span className="num text-xs text-muted">
          <span className="font-semibold text-fg">{done}</span> / {target} {doneLabel}
          {progress > 0 && <span> · {progress} {progressLabel}</span>}
          {missing > 0 && <span className="font-medium text-red-600 dark:text-red-400"> · {missing} fehlen</span>}
        </span>
      </div>
      <Progress
        total={target}
        segments={[
          { value: done, className: "bg-emerald-500" },
          { value: progress, className: "bg-amber-400" },
        ]}
      />
    </div>
  );
}

export function QuotaBars({ row }: { row: QuotaRow }) {
  return (
    <div className="space-y-4">
      <Line label="Videos" target={row.videos.target} done={row.videos.delivered} progress={row.videos.inProgress} doneLabel="fertig" progressLabel="in Arbeit" />
      <Line label="Beiträge" target={row.posts.target} done={row.posts.delivered} progress={row.posts.inProgress} doneLabel="fertig" progressLabel="in Arbeit" />
      <Line label="Vor-Ort-Termine" target={row.visits.target} done={row.visits.done} progress={row.visits.planned} doneLabel="erledigt" progressLabel="geplant" />
    </div>
  );
}

export function QuotaLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> fertig / erledigt</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> in Arbeit / geplant</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-surface-3 ring-1 ring-line-strong" /> fehlt noch</span>
    </div>
  );
}
