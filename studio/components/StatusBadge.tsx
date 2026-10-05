import { CLIENT_STATUS_LABEL, CLIENT_STATUS_STYLE, OUTPUT_STATUS_LABEL, OUTPUT_STATUS_STYLE } from "@/lib/labels";
import type { ClientStatus, OutputStatus } from "@/lib/types";

const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap";

export function StatusBadge({ status }: { status: OutputStatus }) {
  return <span className={`${base} ${OUTPUT_STATUS_STYLE[status]}`}>{OUTPUT_STATUS_LABEL[status]}</span>;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <span className={`${base} ${CLIENT_STATUS_STYLE[status]}`}>{CLIENT_STATUS_LABEL[status]}</span>;
}
