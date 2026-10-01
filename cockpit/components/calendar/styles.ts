import type { CalendarItem } from "@/lib/domain/calendar";

const TYPE_STYLE: Record<string, string> = {
  dreh: "border-l-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-500/10 dark:text-violet-200",
  vor_ort: "border-l-accent bg-accent-soft text-fg",
  meeting: "border-l-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200",
  call: "border-l-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200",
  deadline: "border-l-red-500 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200",
  posting: "border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200",
  intern: "border-l-zinc-400 bg-surface-3 text-fg-2",
  privat: "border-l-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200",
};

export function itemStyle(item: CalendarItem) {
  return TYPE_STYLE[item.type] ?? TYPE_STYLE.intern;
}
