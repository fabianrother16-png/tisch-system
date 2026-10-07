// Formatierungshelfer, die Server (Prompts) und UI gemeinsam nutzen.

export function fmtNum(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return "–";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Mio.`;
  if (abs >= 10_000) return `${Math.round(n / 1000).toLocaleString("de-DE")} Tsd.`;
  if (abs >= 1_000) return `${(n / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Tsd.`;
  return Math.round(n).toLocaleString("de-DE");
}

export function fmtPct(n: number | undefined | null, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return `${(n * 100).toLocaleString("de-DE", { maximumFractionDigits: digits })} %`;
}

export function fmtSec(sec: number | undefined | null): string {
  if (sec == null || !Number.isFinite(sec)) return "–";
  const s = Math.max(0, sec);
  if (s < 60) return `${s.toLocaleString("de-DE", { maximumFractionDigits: 1 })} s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")} min`;
}

export function fmtClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
}

export function fmtDate(value: number | string | undefined): string {
  if (value == null) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(value: number | string | undefined): string {
  if (value == null) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function hashtagLine(tags: string[]): string {
  return tags
    .map((t) => t.trim().replace(/^#+/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .map((t) => `#${t}`)
    .join(" ");
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "video"
  );
}
