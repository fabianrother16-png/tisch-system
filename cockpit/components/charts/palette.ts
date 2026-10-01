/** Feste Zuordnung Entität → Farbslot (Farbe folgt der Entität, nie dem Rang). */
export const PLATFORM_SERIES: Record<string, { color: string; label: string }> = {
  instagram: { color: "var(--chart-2)", label: "Instagram" },
  tiktok: { color: "var(--chart-3)", label: "TikTok" },
  facebook: { color: "var(--chart-1)", label: "Facebook" },
  youtube: { color: "var(--chart-4)", label: "YouTube" },
};
/** Reihenfolge für Stapel/Legenden – validierte Nachbarschaften */
export const PLATFORM_ORDER = ["instagram", "tiktok", "facebook", "youtube"];

export const SLOT = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
