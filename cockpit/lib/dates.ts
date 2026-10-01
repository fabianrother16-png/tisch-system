/*
 * Datums-Helfer auf Basis von ISO-Strings ("YYYY-MM-DD").
 * Gerechnet wird in UTC, damit Sommer-/Winterzeit keine Tage verschiebt;
 * "heute" wird für Europe/Berlin bestimmt.
 */

export const TIMEZONE = "Europe/Berlin";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hm = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function todayISO(): string {
  return ymd.format(new Date());
}

/** Aktuelle Berliner Wandzeit als "YYYY-MM-DDTHH:mm" */
export function nowLocal(): string {
  const d = new Date();
  return `${ymd.format(d)}T${hm.format(d)}`;
}

export function toBerlinDate(date: Date): string {
  return ymd.format(date);
}

function parse(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parse(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fmt(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86_400_000);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonth(): string {
  return monthKey(todayISO());
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: string): string {
  const d = parse(startOfMonth(iso));
  return fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

export function addMonthKey(month: string, delta: number): string {
  return monthKey(addMonths(`${month}-01`, delta));
}

/** Montag der Woche */
export function startOfWeek(iso: string): string {
  const d = parse(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(iso.slice(0, 10), -dow);
}

export function dayOfWeek(iso: string): number {
  return (parse(iso).getUTCDay() + 6) % 7; // 0 = Montag
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function monthsBetween(fromMonth: string, toMonth: string): string[] {
  const out: string[] = [];
  for (let m = fromMonth; m <= toMonth; m = addMonthKey(m, 1)) out.push(m);
  return out;
}

export function isoWeek(iso: string): number {
  const d = parse(iso);
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

export function quarterOf(iso: string): number {
  return Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1;
}
