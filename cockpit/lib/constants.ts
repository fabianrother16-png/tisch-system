/* Beschriftungen, Farben und Auswahllisten für die gesamte Oberfläche. */

export type Tone = "neutral" | "accent" | "green" | "amber" | "red" | "blue" | "violet";

type Option<T extends string = string> = { value: T; label: string; tone?: Tone };

function toMap<T extends string>(options: Option<T>[]) {
  return Object.fromEntries(options.map((o) => [o.value, o])) as Record<T, Option<T>>;
}

export const CUSTOMER_STATUS: Option<"lead" | "aktiv" | "pausiert" | "ehemalig">[] = [
  { value: "lead", label: "Interessent", tone: "blue" },
  { value: "aktiv", label: "Aktiv", tone: "green" },
  { value: "pausiert", label: "Pausiert", tone: "amber" },
  { value: "ehemalig", label: "Ehemalig", tone: "neutral" },
];
export const CUSTOMER_STATUS_MAP = toMap(CUSTOMER_STATUS);

export const CONTRACT_STATUS: Option<"entwurf" | "aktiv" | "gekuendigt" | "beendet">[] = [
  { value: "entwurf", label: "Entwurf", tone: "neutral" },
  { value: "aktiv", label: "Aktiv", tone: "green" },
  { value: "gekuendigt", label: "Gekündigt", tone: "amber" },
  { value: "beendet", label: "Beendet", tone: "neutral" },
];
export const CONTRACT_STATUS_MAP = toMap(CONTRACT_STATUS);

export const BILLING_INTERVALS: Option<"monatlich" | "quartalsweise" | "halbjaehrlich" | "jaehrlich" | "einmalig">[] = [
  { value: "monatlich", label: "Monatlich" },
  { value: "quartalsweise", label: "Quartalsweise" },
  { value: "halbjaehrlich", label: "Halbjährlich" },
  { value: "jaehrlich", label: "Jährlich" },
  { value: "einmalig", label: "Einmalig" },
];
export const BILLING_MONTHS: Record<string, number> = {
  monatlich: 1,
  quartalsweise: 3,
  halbjaehrlich: 6,
  jaehrlich: 12,
  einmalig: 0,
};

export const NOTICE_UNITS: Option<"tage" | "wochen" | "monate">[] = [
  { value: "tage", label: "Tage" },
  { value: "wochen", label: "Wochen" },
  { value: "monate", label: "Monate" },
];

export const QUOTE_STATUS: Option<"entwurf" | "versendet" | "angenommen" | "abgelehnt" | "abgelaufen">[] = [
  { value: "entwurf", label: "Entwurf", tone: "neutral" },
  { value: "versendet", label: "Versendet", tone: "blue" },
  { value: "angenommen", label: "Angenommen", tone: "green" },
  { value: "abgelehnt", label: "Abgelehnt", tone: "red" },
  { value: "abgelaufen", label: "Abgelaufen", tone: "amber" },
];
export const QUOTE_STATUS_MAP = toMap(QUOTE_STATUS);

export const INVOICE_STATUS: Option<"entwurf" | "offen" | "teilbezahlt" | "bezahlt" | "storniert">[] = [
  { value: "entwurf", label: "Entwurf", tone: "neutral" },
  { value: "offen", label: "Offen", tone: "blue" },
  { value: "teilbezahlt", label: "Teilbezahlt", tone: "amber" },
  { value: "bezahlt", label: "Bezahlt", tone: "green" },
  { value: "storniert", label: "Storniert", tone: "neutral" },
];
export const INVOICE_STATUS_MAP = toMap(INVOICE_STATUS);

export const PAYMENT_METHODS: Option[] = [
  { value: "ueberweisung", label: "Überweisung" },
  { value: "lastschrift", label: "Lastschrift" },
  { value: "paypal", label: "PayPal" },
  { value: "bar", label: "Bar" },
  { value: "karte", label: "Karte" },
  { value: "sonstiges", label: "Sonstiges" },
];

export const UNITS = ["Pauschale", "Stück", "Stunde", "Tag", "Monat", "Video", "Beitrag", "km"];

export const TAX_RATES = [19, 7, 0];

/** Ausgaben-Kategorien, angelehnt an die Anlage EÜR */
export const EXPENSE_CATEGORIES: Option[] = [
  { value: "werbung", label: "Werbekosten / Ads" },
  { value: "software", label: "Software & Abos" },
  { value: "equipment", label: "Equipment & Technik" },
  { value: "fremdleistung", label: "Fremdleistungen / Freelancer" },
  { value: "fahrtkosten", label: "Fahrtkosten" },
  { value: "kfz", label: "Kfz-Kosten" },
  { value: "buero", label: "Büro & Material" },
  { value: "telefon", label: "Telefon & Internet" },
  { value: "miete", label: "Miete & Raumkosten" },
  { value: "versicherung", label: "Versicherungen & Beiträge" },
  { value: "beratung", label: "Steuerberatung & Recht" },
  { value: "weiterbildung", label: "Weiterbildung" },
  { value: "bewirtung", label: "Bewirtung" },
  { value: "bank", label: "Bank & Gebühren" },
  { value: "sonstiges", label: "Sonstiges" },
];
export const EXPENSE_CATEGORY_MAP = toMap(EXPENSE_CATEGORIES);

export const CONTENT_FORMATS: Option[] = [
  { value: "reel", label: "Reel / Kurzvideo" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube-Video" },
  { value: "imagefilm", label: "Imagefilm" },
  { value: "drohne", label: "Drohnenvideo" },
  { value: "post", label: "Bild-Post" },
  { value: "karussell", label: "Karussell" },
  { value: "story", label: "Story" },
  { value: "ad", label: "Werbeanzeige" },
  { value: "foto", label: "Fotoshooting" },
  { value: "sonstiges", label: "Sonstiges" },
];
export const CONTENT_FORMAT_MAP = toMap(CONTENT_FORMATS);
/** Formate, die auf das vertragliche Video-Kontingent zählen */
export const VIDEO_FORMATS = ["reel", "tiktok", "youtube", "imagefilm", "drohne", "ad"];

export const CONTENT_STATUS: Option[] = [
  { value: "idee", label: "Idee", tone: "neutral" },
  { value: "geplant", label: "Geplant", tone: "blue" },
  { value: "dreh", label: "Dreh", tone: "violet" },
  { value: "schnitt", label: "Schnitt", tone: "accent" },
  { value: "freigabe", label: "Kundenfreigabe", tone: "amber" },
  { value: "eingeplant", label: "Eingeplant", tone: "blue" },
  { value: "veroeffentlicht", label: "Veröffentlicht", tone: "green" },
];
export const CONTENT_STATUS_MAP = toMap(CONTENT_STATUS);
/** Ab diesem Status gilt ein Content als "geliefert" */
export const DELIVERED_STATUS = ["eingeplant", "veroeffentlicht"];
export const IN_PROGRESS_STATUS = ["geplant", "dreh", "schnitt", "freigabe"];

export const PLATFORMS: Option[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
];
export const PLATFORM_MAP = toMap(PLATFORMS);
export const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#D6336C",
  tiktok: "#111111",
  facebook: "#1877F2",
  youtube: "#FF0000",
  google: "#1A73E8",
  linkedin: "#0A66C2",
  website: "#6B7280",
  meta: "#0866FF",
};

export const AD_PLATFORMS: Option[] = [
  { value: "meta", label: "Meta (Instagram & Facebook)" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
];
export const AD_PLATFORM_MAP = toMap(AD_PLATFORMS);

/** Kennzahlen auf Kontoebene, die erfasst/synchronisiert werden können */
export const ACCOUNT_METRICS: { platform: string; metric: string; label: string; kind: "bestand" | "zeitraum" }[] = [
  { platform: "instagram", metric: "followers", label: "Instagram-Follower", kind: "bestand" },
  { platform: "instagram", metric: "reach", label: "Instagram-Reichweite", kind: "zeitraum" },
  { platform: "instagram", metric: "profile_views", label: "Instagram-Profilaufrufe", kind: "zeitraum" },
  { platform: "tiktok", metric: "followers", label: "TikTok-Follower", kind: "bestand" },
  { platform: "tiktok", metric: "likes_total", label: "TikTok-Likes gesamt", kind: "bestand" },
  { platform: "facebook", metric: "followers", label: "Facebook-Follower", kind: "bestand" },
  { platform: "facebook", metric: "reach", label: "Facebook-Reichweite", kind: "zeitraum" },
  { platform: "youtube", metric: "followers", label: "YouTube-Abonnenten", kind: "bestand" },
  { platform: "google", metric: "rating", label: "Google-Bewertung (Sterne)", kind: "bestand" },
  { platform: "google", metric: "review_count", label: "Anzahl Google-Bewertungen", kind: "bestand" },
  { platform: "google", metric: "website_clicks", label: "Website-Klicks (Google-Profil)", kind: "zeitraum" },
  { platform: "google", metric: "call_clicks", label: "Anrufe (Google-Profil)", kind: "zeitraum" },
  { platform: "google", metric: "direction_requests", label: "Routenanfragen (Google-Profil)", kind: "zeitraum" },
  { platform: "google", metric: "impressions", label: "Profilaufrufe (Google Suche & Maps)", kind: "zeitraum" },
  { platform: "website", metric: "visitors", label: "Website-Besucher", kind: "zeitraum" },
];
export function metricLabel(platform: string, metric: string): string {
  return ACCOUNT_METRICS.find((m) => m.platform === platform && m.metric === metric)?.label ?? `${platform} · ${metric}`;
}
export function metricKind(platform: string, metric: string): "bestand" | "zeitraum" {
  return ACCOUNT_METRICS.find((m) => m.platform === platform && m.metric === metric)?.kind ?? "zeitraum";
}

export const EVENT_TYPES: Option[] = [
  { value: "dreh", label: "Dreh / Shooting", tone: "violet" },
  { value: "vor_ort", label: "Vor-Ort-Termin", tone: "accent" },
  { value: "meeting", label: "Meeting", tone: "blue" },
  { value: "call", label: "Telefonat / Call", tone: "blue" },
  { value: "deadline", label: "Deadline", tone: "red" },
  { value: "posting", label: "Veröffentlichung", tone: "green" },
  { value: "intern", label: "Intern", tone: "neutral" },
  { value: "privat", label: "Abwesend / Urlaub", tone: "amber" },
];
export const EVENT_TYPE_MAP = toMap(EVENT_TYPES);
export const VISIT_EVENT_TYPES = ["dreh", "vor_ort"];

export const TASK_PRIORITY: Option<"niedrig" | "normal" | "hoch">[] = [
  { value: "niedrig", label: "Niedrig", tone: "neutral" },
  { value: "normal", label: "Normal", tone: "blue" },
  { value: "hoch", label: "Hoch", tone: "red" },
];
export const TASK_PRIORITY_MAP = toMap(TASK_PRIORITY);

export const FILE_CATEGORIES: Option[] = [
  { value: "vertrag", label: "Verträge" },
  { value: "angebot", label: "Angebote" },
  { value: "rechnung", label: "Rechnungen" },
  { value: "beleg", label: "Belege" },
  { value: "briefing", label: "Briefings & Konzepte" },
  { value: "design", label: "Design & Branding" },
  { value: "medien", label: "Fotos & Videos" },
  { value: "report", label: "Reports" },
  { value: "intern", label: "Intern / GbR" },
  { value: "sonstiges", label: "Sonstiges" },
];
export const FILE_CATEGORY_MAP = toMap(FILE_CATEGORIES);

export const LINK_CHANNELS: Option[] = [
  { value: "google", label: "Google-Unternehmensprofil" },
  { value: "nfc", label: "NFC-Bewertungskarte" },
  { value: "qr", label: "QR-Code / Flyer" },
  { value: "instagram", label: "Instagram-Bio" },
  { value: "tiktok", label: "TikTok-Bio" },
  { value: "facebook", label: "Facebook" },
  { value: "anzeige", label: "Werbeanzeige" },
  { value: "website", label: "Website" },
  { value: "sonstiges", label: "Sonstiges" },
];
export const LINK_CHANNEL_MAP = toMap(LINK_CHANNELS);

export const ACTIVITY_KINDS: Option[] = [
  { value: "notiz", label: "Notiz" },
  { value: "anruf", label: "Telefonat" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "E-Mail" },
  { value: "anfrage", label: "Website-Anfrage" },
  { value: "system", label: "System" },
];
export const ACTIVITY_KIND_MAP = toMap(ACTIVITY_KINDS);

export const CUSTOMER_COLORS = [
  "#7A5C33", "#2563EB", "#059669", "#7C3AED", "#DB2777",
  "#B4533A", "#0891B2", "#4F46E5", "#65A30D", "#475569",
];

/** Leistungskatalog – entspricht den Leistungen auf rother-marketing (lib/leistungen.ts der Website) */
export const SERVICE_PRESETS = [
  { name: "Analyse und Fahrplan", category: "Strategie", unit: "Pauschale" },
  { name: "Webdesign", category: "Website", unit: "Pauschale" },
  { name: "SEO und Local SEO", category: "Website", unit: "Monat" },
  { name: "Google-Profil und Bewertungen", category: "Google", unit: "Monat" },
  { name: "NFC-Bewertungskarten", category: "Google", unit: "Stück" },
  { name: "Social Media", category: "Social Media", unit: "Monat" },
  { name: "Meta Ads und Google Ads", category: "Werbung", unit: "Monat" },
  { name: "Foto und Video", category: "Foto & Video", unit: "Pauschale" },
  { name: "Videoproduktion (Reel/TikTok)", category: "Foto & Video", unit: "Video" },
  { name: "Drehtag vor Ort", category: "Foto & Video", unit: "Tag" },
  { name: "Fahrtkosten", category: "Sonstiges", unit: "km" },
];
