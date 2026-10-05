import Link from "next/link";
import { formatDate } from "@/lib/labels";
import { getSegment } from "@/lib/segments";
import type { Output } from "@/lib/types";
import { SegmentIcon } from "./SegmentIcon";
import { StatusBadge } from "./StatusBadge";

export function OutputRow({ output, clientName }: { output: Output; clientName?: string }) {
  return (
    <Link
      href={`/ergebnisse/${output.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-cream"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream-dark text-anthracite/70">
        <SegmentIcon slug={output.segment} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{output.title}</span>
        <span className="block truncate text-xs text-anthracite/55">
          {[clientName, getSegment(output.segment)?.label, output.geplantAm ? `geplant ${formatDate(output.geplantAm)}` : null, output.zustaendig]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <StatusBadge status={output.status} />
    </Link>
  );
}
