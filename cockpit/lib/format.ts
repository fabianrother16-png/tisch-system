const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const moneyRound = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("de-DE");
const num1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export { MONTHS, MONTHS_SHORT, WEEKDAYS, WEEKDAYS_SHORT };

export function eur(cents: number | null | undefined): string {
  return money.format((cents ?? 0) / 100);
}

export function eurRound(cents: number | null | undefined): string {
  return moneyRound.format((cents ?? 0) / 100);
}

/** Cent-Betrag als Eingabewert "1234,50" */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "1.234,56" / "1234.56" / "1234" → Cent */
export function parseMoney(input: FormDataEntryValue | string | null | undefined): number {
  if (input == null) return 0;
  let s = String(input).trim().replace(/[€\s]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function parseNumber(input: FormDataEntryValue | string | null | undefined, fallback = 0): number {
  if (input == null) return fallback;
  const s = String(input).trim().replace(/\s/g, "");
  if (!s) return fallback;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export function fmtNumber(n: number | null | undefined): string {
  return num.format(n ?? 0);
}

export function fmtDecimal(n: number | null | undefined): string {
  return num1.format(n ?? 0);
}

/** Große Zahlen kompakt: 1,05 Mio. – darunter mit Tausenderpunkt */
export function fmtCompact(n: number | null | undefined): string {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 2 })} Mio.`;
  return num.format(Math.round(v));
}

export function fmtPercent(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return `${n > 0 ? "+" : ""}${n.toLocaleString("de-DE", { maximumFractionDigits: digits })} %`;
}

export function fmtRate(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return `${n.toLocaleString("de-DE", { maximumFractionDigits: digits })} %`;
}

/** "2026-10-01" → "01.10.2026" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "–";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.`;
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return "–";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d}. ${MONTHS[m - 1]} ${y}`;
}

export function fmtDateTime(isoLocal: string | null | undefined): string {
  if (!isoLocal) return "–";
  const time = isoLocal.length >= 16 ? isoLocal.slice(11, 16) : "";
  return time ? `${fmtDate(isoLocal)}, ${time} Uhr` : fmtDate(isoLocal);
}

export function fmtTime(isoLocal: string | null | undefined): string {
  if (!isoLocal || isoLocal.length < 16) return "";
  return isoLocal.slice(11, 16);
}

/** UTC-Zeitstempel → Berliner Datum + Uhrzeit */
export function fmtTimestamp(isoUtc: string | null | undefined): string {
  if (!isoUtc) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoUtc));
}

export function fmtMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function fmtMonthShort(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
}

export function relativeDays(days: number): string {
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  if (days === -1) return "gestern";
  if (days > 0) return `in ${days} Tagen`;
  return `vor ${Math.abs(days)} Tagen`;
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString("de-DE", { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
