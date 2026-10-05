import type { ClientStatus, OutputStatus } from "./types";

export const OUTPUT_STATUS_LABEL: Record<OutputStatus, string> = {
  offen: "Offen",
  entwurf: "Entwurf",
  pruefung: "Interne Prüfung",
  freigabe: "Beim Kunden",
  freigegeben: "Freigegeben",
  veroeffentlicht: "Veröffentlicht",
};

export const OUTPUT_STATUS_STYLE: Record<OutputStatus, string> = {
  offen: "bg-cream-dark text-anthracite/70 border-cream-darker",
  entwurf: "bg-amber-50 text-amber-800 border-amber-200",
  pruefung: "bg-sky-50 text-sky-800 border-sky-200",
  freigabe: "bg-violet-50 text-violet-800 border-violet-200",
  freigegeben: "bg-emerald-50 text-emerald-800 border-emerald-200",
  veroeffentlicht: "bg-anthracite text-cream border-anthracite",
};

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  lead: "Lead",
  onboarding: "Onboarding",
  aktiv: "Aktiv",
  pausiert: "Pausiert",
};

export const CLIENT_STATUS_STYLE: Record<ClientStatus, string> = {
  lead: "bg-sky-50 text-sky-800 border-sky-200",
  onboarding: "bg-amber-50 text-amber-800 border-amber-200",
  aktiv: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pausiert: "bg-cream-dark text-anthracite/60 border-cream-darker",
};

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) {
  if (!iso) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("de-DE", { ...opts, timeZone: "Europe/Berlin" });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

/** Aktueller Monat als JJJJ-MM (Berliner Zeit). */
export function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Berlin" }).format(new Date());
  return parts.slice(0, 7);
}

export function today() {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Berlin" }).format(new Date());
}
