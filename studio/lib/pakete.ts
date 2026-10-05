import type { PaketId, SegmentSlug } from "./types";

export interface PaketAufgabe {
  segment: SegmentSlug;
  titel: string;
  prompt: string;
}

export interface Paket {
  id: PaketId;
  label: string;
  beschreibung: string;
  /** Wiederkehrende Lieferungen pro Monat („Monats-Autopilot“). {monat} wird ersetzt. */
  monatlich: PaketAufgabe[];
}

// Diese Pakete sind ein Startpunkt – passt Inhalte und Umfang an eure echten Pakete an.
const BASIS: PaketAufgabe[] = [
  {
    segment: "google-profil",
    titel: "Google-Beiträge {monat}",
    prompt:
      "Schreib vier Google-Beiträge für {monat} (Typ, Titel, Text, Button, Bildidee, geplanter Tag) – passend zu Saison, Feiertagen und Anlässen in der Region.",
  },
  {
    segment: "google-profil",
    titel: "Bewertungen beantworten {monat}",
    prompt: "Beantworte die neuen Google-Bewertungen des Kunden aus {monat}:\n\n[Bewertungen hier einfügen]",
  },
  {
    segment: "seo",
    titel: "SEO-Kurzcheck {monat}",
    prompt:
      "Mach einen SEO-Kurzcheck der Website des Kunden (Technik, Geschwindigkeit, Google-Profil-Konsistenz) und nenne die drei wichtigsten Maßnahmen für {monat}.",
  },
  {
    segment: "reporting",
    titel: "Monatsbericht {monat}",
    prompt: "Erstelle den Monatsbericht für {monat}. Hier die Zahlen:\n\n[Zahlen oder Exporte einfügen]",
  },
];

const WACHSTUM: PaketAufgabe[] = [
  {
    segment: "social",
    titel: "Redaktionsplan {monat}",
    prompt:
      "Erstelle den Redaktionsplan für {monat} (Instagram und Facebook, 3 Beiträge pro Woche inkl. Reels-Platzhaltern) mit ausformulierten Posts und CSV-Export.",
  },
  {
    segment: "video",
    titel: "Reels/TikToks {monat} – Teil 1",
    prompt:
      "Schreib vier fertige Reel-/TikTok-Skripte mit Shotlist für {monat} (Mix aus Reichweite, Vertrauen und Angebot). Recherchiere vorher kurz aktuelle Trends in der Branche.",
  },
  {
    segment: "video",
    titel: "Reels/TikToks {monat} – Teil 2",
    prompt:
      "Schreib vier weitere Reel-/TikTok-Skripte mit Shotlist für {monat}, diesmal mit Fokus auf Behind the Scenes, Team und POV-Aufnahmen.",
  },
  {
    segment: "seo",
    titel: "Blogartikel {monat}",
    prompt:
      "Wähle das wichtigste Keyword-Thema für {monat} und schreib dazu einen SEO-optimierten Blogartikel inkl. Title, Description und FAQ.",
  },
];

const PREMIUM: PaketAufgabe[] = [
  {
    segment: "ads",
    titel: "Ads-Kampagne {monat}",
    prompt:
      "Plane bzw. aktualisiere die Meta-Ads-Kampagne des Kunden für {monat}: neue Creatives, Anzeigentexte in drei Varianten und Testplan. Bisherige Zahlen (falls vorhanden):\n\n[Zahlen einfügen]",
  },
  {
    segment: "video",
    titel: "Drehplan {monat}",
    prompt: "Erstelle den Drehplan für den Drehtag im {monat} beim Kunden (Drohne + POV), passend zu den geplanten Videos.",
  },
  {
    segment: "strategie",
    titel: "Wettbewerbs-Monitoring {monat}",
    prompt:
      "Wie haben sich die lokalen Wettbewerber des Kunden entwickelt (Bewertungen, Aktivität, neue Angebote)? Was heißt das für unsere Planung im {monat}?",
  },
];

export const PAKETE: Paket[] = [
  {
    id: "starter",
    label: "Starter",
    beschreibung: "Google-Profil, Bewertungen, SEO-Basis, Monatsbericht",
    monatlich: BASIS,
  },
  {
    id: "wachstum",
    label: "Wachstum",
    beschreibung: "Starter + Social Media, 8 Kurzvideos, Blogartikel",
    monatlich: [...BASIS, ...WACHSTUM],
  },
  {
    id: "premium",
    label: "Premium",
    beschreibung: "Wachstum + Meta Ads, Drehtag, Wettbewerbs-Monitoring",
    monatlich: [...BASIS, ...WACHSTUM, ...PREMIUM],
  },
  {
    id: "individuell",
    label: "Individuell",
    beschreibung: "Gebuchte Segmente frei wählbar",
    monatlich: [],
  },
];

export function getPaket(id: string) {
  return PAKETE.find((p) => p.id === id);
}

/** Für „individuell“: alle Standard-Aufgaben der gebuchten Segmente. */
export function aufgabenFuer(paket: PaketId, leistungen: SegmentSlug[]): PaketAufgabe[] {
  if (paket !== "individuell") return getPaket(paket)?.monatlich ?? [];
  const alle = [...BASIS, ...WACHSTUM, ...PREMIUM];
  return alle.filter((a) => leistungen.includes(a.segment));
}

export function monatLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });
}
