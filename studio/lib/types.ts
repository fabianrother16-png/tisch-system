export const SEGMENT_SLUGS = [
  "strategie",
  "seo",
  "google-profil",
  "video",
  "social",
  "website",
  "ads",
  "reporting",
  "akquise",
  "qualitaet",
] as const;

export type SegmentSlug = (typeof SEGMENT_SLUGS)[number];

export function isSegmentSlug(value: unknown): value is SegmentSlug {
  return typeof value === "string" && (SEGMENT_SLUGS as readonly string[]).includes(value);
}

export const CLIENT_STATUS = ["lead", "onboarding", "aktiv", "pausiert"] as const;
export type ClientStatus = (typeof CLIENT_STATUS)[number];

export const PAKET_IDS = ["starter", "wachstum", "premium", "individuell"] as const;
export type PaketId = (typeof PAKET_IDS)[number];

/** Die Kundenakte – alles, was jeder Agent über den Kunden wissen muss. */
export interface Client {
  id: string;
  name: string;
  branche: string;
  ort: string;
  website: string;
  googleProfil: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  linkedin: string;
  ansprechpartner: string;
  zielgruppe: string;
  angebot: string;
  usp: string;
  tonalitaet: string;
  farben: string;
  wettbewerber: string;
  keywords: string;
  dosDonts: string;
  notizen: string;
  status: ClientStatus;
  paket: PaketId;
  /** Gebuchte Segmente beim Paket „individuell“. */
  leistungen: SegmentSlug[];
  createdAt: string;
  updatedAt: string;
}

export const CLIENT_TEXT_FIELDS = [
  "name",
  "branche",
  "ort",
  "website",
  "googleProfil",
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
  "ansprechpartner",
  "zielgruppe",
  "angebot",
  "usp",
  "tonalitaet",
  "farben",
  "wettbewerber",
  "keywords",
  "dosDonts",
  "notizen",
] as const satisfies readonly (keyof Client)[];

export const OUTPUT_STATUS = [
  "offen",
  "entwurf",
  "pruefung",
  "freigabe",
  "freigegeben",
  "veroeffentlicht",
] as const;
export type OutputStatus = (typeof OUTPUT_STATUS)[number];

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
  webFetches: number;
}

export interface Source {
  url: string;
  title: string;
}

export interface OutputVersion {
  content: string;
  createdAt: string;
}

/** Ein Ergebnis (Lieferung) – vom offenen Auftrag bis zur Veröffentlichung. */
export interface Output {
  id: string;
  clientId: string | null;
  segment: SegmentSlug;
  title: string;
  prompt: string;
  content: string;
  status: OutputStatus;
  zustaendig: string;
  geplantAm: string | null;
  quellen: Source[];
  versionen: OutputVersion[];
  pruefbericht: string | null;
  freigabeToken: string | null;
  kundenFeedback: { text: string; createdAt: string; entscheidung: "freigegeben" | "aenderung" }[];
  usage: Usage;
  kostenUsd: number;
  model: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  agenturName: string;
  agenturOrt: string;
  agenturWebsite: string;
  /** Freitext, der allen Agenten als Agentur-Kontext mitgegeben wird (Leistungen, Preise, Besonderheiten). */
  agenturInfo: string;
  /** Preisliste/Pakete – wird für Angebote genutzt. Leer = Platzhalter im Angebot. */
  preisliste: string;
  team: string[];
  model: string;
  webhookUrl: string;
}

export const EMPTY_USAGE: Usage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  webSearches: 0,
  webFetches: 0,
};
