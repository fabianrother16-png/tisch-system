import type { SegmentSlug } from "./types";

/** Werkzeuge, die das Studio selbst ausführt (zusätzlich zu Websuche & Webabruf von Anthropic). */
export type StudioTool =
  | "seo_check"
  | "pagespeed"
  | "tiktok_research"
  | "instagram_research"
  | "google_maps_research";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export const TOOL_LABELS: Record<StudioTool, string> = {
  seo_check: "SEO-Check",
  pagespeed: "PageSpeed",
  tiktok_research: "TikTok-Daten",
  instagram_research: "Instagram-Daten",
  google_maps_research: "Google-Maps-Daten",
};

export interface QuickAction {
  label: string;
  prompt: string;
}

export interface Segment {
  slug: SegmentSlug;
  label: string;
  kurz: string;
  /** Wird ohne Kunde gearbeitet (z. B. Akquise für SICHTWERK selbst)? */
  ohneKunde: boolean;
  tools: StudioTool[];
  effort: Effort;
  quickActions: QuickAction[];
}

// Platzhalter in eckigen Klammern sind bewusst sichtbar – das Studio markiert sie im Eingabefeld.
export const SEGMENTS: Segment[] = [
  {
    slug: "strategie",
    label: "Strategie & Projektleitung",
    kurz: "Sichtbarkeits-Check, Wettbewerb, 90-Tage-Plan, Onboarding",
    ohneKunde: false,
    tools: ["seo_check", "pagespeed", "google_maps_research", "instagram_research", "tiktok_research"],
    effort: "high",
    quickActions: [
      {
        label: "Sichtbarkeits-Check",
        prompt:
          "Mach einen vollständigen Sichtbarkeits-Check für den Kunden: Google-Profil, Bewertungen, Website, SEO, Social Media und Ads – mit Punktwerten (0–10), Belegen aus der Recherche und den fünf größten Hebeln in der richtigen Reihenfolge.",
      },
      {
        label: "Wettbewerbsanalyse",
        prompt:
          "Analysiere die 3–5 wichtigsten lokalen Wettbewerber des Kunden (Google-Profil, Bewertungen, Website, Social Media) und zeig, wo unser Kunde sich abheben kann.",
      },
      {
        label: "90-Tage-Plan",
        prompt:
          "Erstelle einen 90-Tage-Plan für den Kunden: Quick Wins in den ersten 14 Tagen, Maßnahmen pro Monat mit Verantwortlichen und KPIs. Berücksichtige die gebuchten Leistungen.",
      },
      {
        label: "Content-Säulen",
        prompt:
          "Entwickle 3–5 Content-Säulen für den Kunden mit Zielen, je mindestens fünf Themenideen, passenden Formaten und Anteil am Redaktionsplan.",
      },
      {
        label: "Kick-off & Zugänge",
        prompt:
          "Erstelle für den Kunden die Kick-off-Agenda (60 Minuten), einen kurzen Onboarding-Fragebogen und die Zugänge-Checkliste mit Schritt-für-Schritt-Anleitungen für den Kunden.",
      },
      {
        label: "Paketempfehlung",
        prompt:
          "Welche SICHTWERK-Leistungen sind für diesen Kunden jetzt am sinnvollsten? Begründe die Empfehlung mit Befunden und zeig, was wir in welcher Reihenfolge liefern.",
      },
    ],
  },
  {
    slug: "seo",
    label: "SEO & KI-Suche",
    kurz: "Audits, Keywords, Texte, Schema, ChatGPT- & Google-Sichtbarkeit",
    ohneKunde: false,
    tools: ["seo_check", "pagespeed", "google_maps_research"],
    effort: "high",
    quickActions: [
      {
        label: "SEO-Audit",
        prompt:
          "Mach ein SEO-Audit der Website des Kunden (Technik, On-Page, lokale SEO, Inhalte, KI-Sichtbarkeit) mit Ampel-Übersicht, Befund-Tabelle und den Top-5-Maßnahmen.",
      },
      {
        label: "Keyword-Map",
        prompt:
          "Erstelle eine Keyword-Map für den Kunden: Themen-Cluster mit Suchintention, Zuordnung zu bestehenden oder neuen Seiten und Priorität.",
      },
      {
        label: "Meta-Titel & Beschreibungen",
        prompt:
          "Schreib optimierte Meta-Titel und Meta-Beschreibungen für die wichtigsten Seiten der Website des Kunden (mit Zeichenzahl).",
      },
      {
        label: "Blogartikel",
        prompt: "Schreib einen SEO-optimierten Blogartikel für den Kunden zum Thema: [Thema]",
      },
      {
        label: "Schema-Markup",
        prompt:
          "Erstelle das passende JSON-LD (LocalBusiness bzw. spezifischer Typ, FAQPage falls sinnvoll) für die Website des Kunden und erkläre, wo es eingebaut wird.",
      },
      {
        label: "KI-Sichtbarkeit (GEO)",
        prompt:
          "Wie sichtbar ist der Kunde in ChatGPT, Perplexity und Google AI Overviews? Leite typische Fragen ab, prüfe, welche Quellen und Wettbewerber auftauchen, und gib einen konkreten Maßnahmenplan.",
      },
      {
        label: "Branchenbuch-Liste",
        prompt:
          "Erstelle eine priorisierte Liste der Branchenbücher und Portale, in denen der Kunde mit identischen Daten (NAP) eingetragen sein sollte – inklusive branchenspezifischer Portale.",
      },
    ],
  },
  {
    slug: "google-profil",
    label: "Google-Profil & Bewertungen",
    kurz: "Profil optimieren, Beiträge, Antworten, mehr Bewertungen, NFC-Karten",
    ohneKunde: false,
    tools: ["google_maps_research", "seo_check"],
    effort: "medium",
    quickActions: [
      {
        label: "Profil optimieren",
        prompt:
          "Optimiere das Google-Unternehmensprofil des Kunden: Kategorien, Beschreibung (max. 750 Zeichen), Leistungen, Attribute, Fotoplan und Links – jeweils mit fertigem Text.",
      },
      {
        label: "4 Google-Beiträge",
        prompt:
          "Schreib vier Google-Beiträge für die nächsten vier Wochen (Typ, Titel, Text, Button, Bildidee, geplanter Tag) – passend zur Saison.",
      },
      {
        label: "Bewertungen beantworten",
        prompt: "Beantworte diese Google-Bewertungen im Namen des Kunden:\n\n[Bewertungen hier einfügen]",
      },
      {
        label: "Bewertungs-Kampagne",
        prompt:
          "Entwickle eine Kampagne, mit der der Kunde regelmäßig echte Google-Bewertungen bekommt: Ablauf, Mitarbeiter-Schulung, Texte für WhatsApp/E-Mail/Aufsteller – richtlinienkonform.",
      },
      {
        label: "NFC-Karte & Aufsteller",
        prompt:
          "Gestalte Texte und ein Gestaltungsbriefing für NFC-Bewertungskarten und Tischaufsteller des Kunden, inklusive Platzierungsideen.",
      },
      {
        label: "Maps-Wettbewerbsvergleich",
        prompt:
          "Vergleiche das Google-Profil des Kunden mit den Top-Wettbewerbern auf Google Maps (Bewertung, Anzahl, Kategorien) und zeig, was wir in 30 Tagen aufholen können.",
      },
    ],
  },
  {
    slug: "video",
    label: "Video: TikTok & Reels",
    kurz: "Ideen, Hooks, Skripte, Drehpläne, Trends, Higgsfield-KI-Video",
    ohneKunde: false,
    tools: ["tiktok_research", "instagram_research"],
    effort: "medium",
    quickActions: [
      {
        label: "10 Ideen + Hooks",
        prompt:
          "Entwickle 10 Kurzvideo-Ideen für den Kunden (TikTok/Reels) mit je drei Hook-Varianten, Format und Ziel. Recherchiere vorher, was in der Branche und Region gerade funktioniert.",
      },
      {
        label: "Skript mit Shotlist",
        prompt: "Schreib ein fertiges Reel-/TikTok-Skript mit Shotlist für den Kunden zum Thema: [Thema]",
      },
      {
        label: "Drehplan Drehtag",
        prompt:
          "Erstelle einen Drehplan für einen Drehtag beim Kunden (ca. 4 Stunden) mit Drohne und POV-Kamera: Ablauf, Shotlist nach Orten, benötigte Personen, Genehmigungen, Material für mindestens 8 Videos.",
      },
      {
        label: "Trend-Analyse",
        prompt:
          "Analysiere die aktuell erfolgreichsten TikToks und Reels in der Branche des Kunden (gern regional) und leite fünf Formate ab, die wir für den Kunden adaptieren.",
      },
      {
        label: "Serienformat",
        prompt:
          "Entwickle ein wöchentliches Serienformat für den Kunden mit Name, Ablauf, Wiedererkennungselementen und den ersten vier Folgen als Skript.",
      },
      {
        label: "KI-B-Roll (Higgsfield)",
        prompt:
          "Plane 4 KI-Szenen als B-Roll für die nächsten Videos des Kunden und liefere sie als Higgsfield-Prompts (9:16).",
      },
      {
        label: "Recruiting-Video",
        prompt:
          "Entwickle zwei Recruiting-Videos für den Kunden (Fachkräfte und Azubis) mit Skript, Shotlist und Caption.",
      },
    ],
  },
  {
    slug: "social",
    label: "Social Media",
    kurz: "Redaktionsplan, Posts, Karussells, Stories, Community, LinkedIn",
    ohneKunde: false,
    tools: ["instagram_research", "tiktok_research"],
    effort: "medium",
    quickActions: [
      {
        label: "Redaktionsplan Monat",
        prompt:
          "Erstelle den Redaktionsplan für den nächsten Monat (Instagram, Facebook und – falls passend – LinkedIn) mit ausformulierten Posts und CSV-Export.",
      },
      {
        label: "Karussell-Post",
        prompt: "Erstelle einen Karussell-Post für den Kunden (Folie für Folie + Caption) zum Thema: [Thema]",
      },
      {
        label: "Story-Abfolge",
        prompt:
          "Plane eine interaktive Story-Abfolge (5–7 Slides mit Stickern) für den Kunden zum Thema: [Thema]",
      },
      {
        label: "Bio & Highlights",
        prompt:
          "Optimiere Instagram-Name-Feld, Bio, Highlights und Link in Bio des Kunden – mit zwei Varianten.",
      },
      {
        label: "Antwortvorlagen",
        prompt:
          "Erstelle Antwortvorlagen für Kommentare und Direktnachrichten des Kunden (Lob, Fragen, Kritik, Trolle, Bewerbungen) inkl. Eskalationsleitfaden.",
      },
      {
        label: "LinkedIn für Inhaber",
        prompt:
          "Erstelle vier LinkedIn-Posts für den Inhaber bzw. die Geschäftsführung des Kunden (Expertise, Einblicke, Employer Branding).",
      },
      {
        label: "Gewinnspiel",
        prompt:
          "Plane ein Instagram-Gewinnspiel für den Kunden mit Post-Text, Story-Begleitung und rechtssicheren Teilnahmebedingungen.",
      },
    ],
  },
  {
    slug: "website",
    label: "Website & Landingpages",
    kurz: "Komplette Seiten als HTML, Konzepte, Texte, Conversion-Checks",
    ohneKunde: false,
    tools: ["seo_check", "pagespeed"],
    effort: "high",
    quickActions: [
      {
        label: "One-Pager bauen",
        prompt:
          "Bau eine komplette One-Page-Website für den Kunden als fertiges HTML – mit Texten, SEO-Daten, LocalBusiness-Schema und Kontaktbereich.",
      },
      {
        label: "Landingpage bauen",
        prompt: "Bau eine Landingpage für den Kunden als fertiges HTML für diese Aktion/Kampagne: [Angebot oder Kampagne]",
      },
      {
        label: "Website-Konzept",
        prompt:
          "Erstelle ein Website-Konzept für den Kunden: Sitemap, Aufbau jeder Seite, Texte je Abschnitt, SEO-Daten und Bildbedarf (für unseren Drehtag).",
      },
      {
        label: "Conversion-Check",
        prompt:
          "Prüfe die bestehende Website des Kunden auf Conversion, Mobilansicht, Geschwindigkeit und Rechtliches und gib priorisierte Verbesserungen mit fertigen Textvorschlägen.",
      },
      {
        label: "Leistungsseite texten",
        prompt: "Schreib die Texte für eine Leistungsseite des Kunden zu: [Leistung]",
      },
    ],
  },
  {
    slug: "ads",
    label: "Meta & Google Ads",
    kurz: "Kampagnen-Setups, Anzeigentexte, Creatives, Recruiting, Tracking",
    ohneKunde: false,
    tools: ["instagram_research", "seo_check"],
    effort: "medium",
    quickActions: [
      {
        label: "Meta-Kampagne (Leads)",
        prompt:
          "Plane eine Meta-Ads-Kampagne für den Kunden, die Anfragen bzw. Reservierungen bringt: Struktur, Zielgruppe, Budget-Startwert, Anzeigen in drei Varianten, Creative-Briefings, Tracking und Testplan.",
      },
      {
        label: "Recruiting-Kampagne",
        prompt:
          "Plane eine Recruiting-Kampagne auf Meta für den Kunden für diese Stelle: [Stelle] – inkl. Anzeigen, Creatives, Lead-Formular und Sonderkategorie-Hinweisen.",
      },
      {
        label: "Google-Suchkampagne",
        prompt:
          "Plane eine Google-Ads-Suchkampagne für den Kunden: Keywords, auszuschließende Keywords, 15 Anzeigentitel und 4 Beschreibungen (mit Zeichenzahl), Assets und Tracking.",
      },
      {
        label: "Kampagne optimieren",
        prompt: "Analysiere diese Kampagnenzahlen und gib konkrete Optimierungen:\n\n[Zahlen einfügen]",
      },
    ],
  },
  {
    slug: "reporting",
    label: "Reporting",
    kurz: "Monatsberichte, KPI-Analysen, Leistungsnachweise",
    ohneKunde: false,
    tools: ["google_maps_research", "pagespeed", "seo_check"],
    effort: "medium",
    quickActions: [
      {
        label: "Monatsbericht",
        prompt: "Erstelle den Monatsbericht für [Monat] für den Kunden. Hier die Zahlen:\n\n[Zahlen oder Exporte einfügen]",
      },
      {
        label: "Live-Momentaufnahme",
        prompt:
          "Erstelle eine aktuelle Momentaufnahme für den Kunden: Google-Bewertung und Anzahl im Vergleich zu Wettbewerbern, Website-Geschwindigkeit und SEO-Basischeck.",
      },
      {
        label: "Quartalsrückblick",
        prompt: "Erstelle einen Quartalsrückblick für den Kunden aus diesen Zahlen:\n\n[Zahlen einfügen]",
      },
    ],
  },
  {
    slug: "akquise",
    label: "Akquise & Angebote",
    kurz: "Neue Kunden finden, Mini-Audits, Angebote, Gesprächsleitfäden",
    ohneKunde: true,
    tools: ["google_maps_research", "seo_check", "pagespeed", "instagram_research"],
    effort: "medium",
    quickActions: [
      {
        label: "Lead-Liste finden",
        prompt:
          "Finde 15 potenzielle Kunden für SICHTWERK: [Branche] in [Ort]. Priorisiere nach Chance und nenne für jeden einen konkreten Aufhänger.",
      },
      {
        label: "Mini-Audit (Türöffner)",
        prompt: "Erstelle ein Mini-Audit als Türöffner für diesen Interessenten: [Name, Ort, Website]",
      },
      {
        label: "Angebot schreiben",
        prompt:
          "Schreib ein Angebot für diesen Interessenten mit drei Optionen: [Name, Ort, was besprochen wurde]",
      },
      {
        label: "Besuch & Brief",
        prompt:
          "Erstelle einen Besuchsleitfaden und einen personalisierten Brief für diesen Interessenten: [Name, Ort, Befund]",
      },
      {
        label: "Einwandbehandlung",
        prompt: "Erstelle eine Einwandbehandlung für Gespräche mit [Branche]-Betrieben.",
      },
    ],
  },
  {
    slug: "qualitaet",
    label: "Qualität & Recht",
    kurz: "Prüfung vor der Freigabe: Fakten, Ton, Plattformregeln, Recht",
    ohneKunde: false,
    tools: ["seo_check"],
    effort: "medium",
    quickActions: [
      {
        label: "Inhalt prüfen",
        prompt: "Prüfe diesen Inhalt vor der Freigabe:\n\n[Inhalt einfügen]",
      },
      {
        label: "Website rechtlich prüfen",
        prompt:
          "Prüfe die Website des Kunden auf Impressum, Datenschutz, Cookie-Einbindung, Schriften, Karten, Formulare und Barrierefreiheit.",
      },
    ],
  },
];

export function getSegment(slug: string): Segment | undefined {
  return SEGMENTS.find((s) => s.slug === slug);
}

/**
 * Schnelle, kostenlose Zuordnung eines Freitext-Auftrags zum passenden Segment.
 * Reihenfolge = Priorität bei Gleichstand.
 */
const ROUTING: { slug: SegmentSlug; words: string[] }[] = [
  { slug: "qualitaet", words: ["prüf", "pruef", "check vor", "freigabe", "rechtlich", "korrektur", "korrigier", "lektor"] },
  { slug: "website", words: ["website", "webseite", "homepage", "landingpage", "landing page", "one-pager", "onepager", "html", "seite bauen", "relaunch", "impressum"] },
  { slug: "video", words: ["video", "reel", "tiktok", "short", "skript", "hook", "dreh", "drohne", "pov", "higgsfield", "b-roll", "clip"] },
  { slug: "google-profil", words: ["google-profil", "google profil", "unternehmensprofil", "business profil", "gbp", "bewertung", "rezension", "maps", "nfc", "google-beitr", "google beitr"] },
  { slug: "seo", words: ["seo", "keyword", "ranking", "blog", "artikel", "meta-titel", "meta titel", "schema", "chatgpt", "perplexity", "ki-suche", "ki-sichtbarkeit", "branchenbuch", "suchmaschine"] },
  { slug: "ads", words: ["ads", "anzeige", "kampagne", "werbung schalten", "meta ads", "google ads", "budget", "recruiting-kampagne", "lead-formular"] },
  { slug: "social", words: ["post", "instagram", "insta", "facebook", "linkedin", "karussell", "story", "redaktionsplan", "caption", "bio", "community", "gewinnspiel", "social"] },
  { slug: "reporting", words: ["report", "bericht", "auswertung", "kpi", "zahlen", "analyse der zahlen", "statistik", "rückblick"] },
  { slug: "akquise", words: ["akquise", "neukunde", "lead", "angebot", "pitch", "kaltakquise", "interessent", "einwand", "verkauf"] },
  { slug: "strategie", words: ["strategie", "plan", "wettbewerb", "konkurrenz", "onboarding", "kick-off", "zielgruppe", "positionierung", "sichtbarkeit", "paket"] },
];

export function routeCommand(text: string): SegmentSlug {
  const t = text.toLowerCase();
  let best: { slug: SegmentSlug; score: number } = { slug: "strategie", score: 0 };
  for (const r of ROUTING) {
    const score = r.words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
    if (score > best.score) best = { slug: r.slug, score };
  }
  return best.slug;
}
