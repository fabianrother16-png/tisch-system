// Strukturierte Ausgabeformate aller KI-Aufgaben. Diese Zod-Schemas werden
// serverseitig als `output_config.format` an Claude übergeben (garantiert
// valides JSON) und clientseitig als Typen benutzt.
//
// Hinweis: Zahlenbereiche stehen bewusst in `.describe()` statt in
// `.min()/.max()`, weil Structured Outputs nicht jede JSON-Schema-
// Einschränkung erzwingt – die Beschreibung erreicht das Modell immer.

import { z } from "zod";

/**
 * Aufzählung, die beim Parsen nie die ganze Antwort scheitern lässt: Das SDK
 * reicht `enum` nur als Beschreibung an die API weiter (keine harte
 * Grammatik-Garantie). Weicht das Modell ab, greift der Fallback-Wert.
 */
function choice<const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) {
  return z.enum(values).catch(fallback);
}

const PlatformTarget = choice(["tiktok", "instagram", "beide"], "beide");

const Evidence = z.object({
  punkt: z.string(),
  beleg: z
    .string()
    .describe(
      "Konkreter Beleg aus den gelieferten Daten: Post-ID mit Kennzahl, Zitat aus Caption/Transkript oder beobachtetes Muster. Keine erfundenen Zahlen.",
    ),
});

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------

export const SearchPlanSchema = z.object({
  nische: z.string().describe("Präzise Beschreibung der Nische in einem Satz"),
  tiktokSuchbegriffe: z
    .array(z.string())
    .describe(
      "4-5 TikTok-Suchbegriffe, so wie echte Nutzer in der Region suchen würden (Sprache der Zielgruppe). Mischung aus Berufsbezeichnung und typischen Content-Themen.",
    ),
  instagramHashtags: z
    .array(z.string())
    .describe(
      "4-5 Instagram-Hashtags OHNE #, klein geschrieben, ohne Leerzeichen, nischenspezifisch und mit realistischem Volumen (keine generischen wie fyp/viral).",
    ),
  trendSuchbegriffe: z
    .array(z.string())
    .describe("2-3 etwas breitere Begriffe, um aktuelle Trends im Umfeld der Nische zu finden"),
  konkurrenzMerkmale: z
    .array(z.string())
    .describe("Woran man einen echten Content-Konkurrenten erkennt"),
  ausschluss: z
    .array(z.string())
    .describe("Was KEIN relevanter Konkurrent ist (z. B. reine Meme-Seiten, andere Sprache, Großkonzern-Werbung)"),
});
export type SearchPlan = z.infer<typeof SearchPlanSchema>;

export const SelectionSchema = z.object({
  hauptkonkurrent: z.object({
    key: z.string().describe("Exakter key aus der Kandidatenliste"),
    begruendung: z.string(),
  }),
  weitere: z
    .array(z.object({ key: z.string(), begruendung: z.string() }))
    .describe("Weitere relevante Konkurrenten, stärkster zuerst, höchstens so viele wie angefragt"),
  verworfen: z
    .array(z.object({ key: z.string(), grund: z.string() }))
    .describe("Auffällige Kandidaten, die bewusst NICHT genommen wurden, mit kurzem Grund"),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const MainAnalysisSchema = z.object({
  kurzfazit: z.string().describe("3-4 Sätze: Wer ist das, warum funktioniert es, was heißt das für uns"),
  positionierung: z.string(),
  warumVieleAufrufe: z.array(Evidence).describe("Die echten Gründe für die Reichweite, wichtigster zuerst"),
  wasSieRichtigMachen: z.array(Evidence),
  wasSieFalschMachen: z.array(Evidence),
  hookMuster: z.array(
    z.object({
      muster: z.string(),
      beispiel: z.string().describe("Wörtliches Beispiel aus Caption/Transkript, falls vorhanden"),
      wirkung: z.string(),
    }),
  ),
  formate: z.array(
    z.object({
      format: z.string(),
      haeufigkeit: z.string(),
      performance: z.string(),
    }),
  ),
  topVideos: z.array(z.object({ postId: z.string(), warumErfolgreich: z.string() })),
  flopVideos: z.array(z.object({ postId: z.string(), warumSchwach: z.string() })),
  stil: z.object({
    tonalitaet: z.string(),
    schnitt: z.string(),
    laenge: z.string(),
    ctas: z.string(),
    postingRhythmus: z.string(),
  }),
  chancenFuerUns: z
    .array(z.string())
    .describe("Konkrete Lücken und Chancen, die unser Kunde besser machen kann"),
});
export type MainAnalysis = z.infer<typeof MainAnalysisSchema>;

export const CompetitorAnalysisSchema = z.object({
  kurzprofil: z.string(),
  warumAufrufe: z.string(),
  richtig: z.array(z.string()),
  falsch: z.array(z.string()),
  besterHook: z.object({
    text: z.string(),
    postId: z.string(),
  }),
  uebertragbareIdee: z.string().describe("Eine konkrete Idee, die unser Kunde übernehmen und verbessern kann"),
  bewertung: z.number().describe("Content-Qualität insgesamt, 0 bis 10"),
});
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

export const SynthesisSchema = z.object({
  erfolgsmuster: z.array(
    z.object({
      muster: z.string(),
      verbreitung: z.string().describe("Bei wie vielen der analysierten Konkurrenten beobachtet"),
      anwendung: z.string(),
    }),
  ),
  haeufigeFehler: z.array(z.object({ fehler: z.string(), besserMachen: z.string() })),
  contentLuecken: z.array(z.object({ luecke: z.string(), idee: z.string() })),
  benchmarks: z.object({
    typischeLaenge: z.string(),
    hookDauer: z.string(),
    postingFrequenz: z.string(),
    gutePerformance: z.string().describe("Was in dieser Nische als gute Aufrufzahl gilt, abgeleitet aus den Daten"),
  }),
});
export type Synthesis = z.infer<typeof SynthesisSchema>;

export const TrendReportSchema = z.object({
  zusammenfassung: z.string(),
  trends: z.array(
    z.object({
      name: z.string(),
      typ: choice(["format", "sound", "hook", "thema", "hashtag", "stil"], "thema"),
      plattform: PlatformTarget,
      beschreibung: z.string(),
      passung: z.number().describe("0 bis 10: Wie gut passt der Trend zur Nische und Zielgruppe"),
      umsetzung: z.string().describe("Wie unser Kunde den Trend konkret nutzt"),
      beleg: z.string().describe("Datenbeleg (Post-ID, Zahl) oder Quelle der Websuche"),
      haltbarkeit: choice(["kurzfristig", "mittelfristig", "evergreen"], "mittelfristig"),
    }),
  ),
  vermeiden: z.array(z.string()).describe("Trends/Muster, die für diese Nische schaden oder bereits tot sind"),
});
export type TrendReport = z.infer<typeof TrendReportSchema>;

// ---------------------------------------------------------------------------
// Skript (Entwurf und finale Version teilen sich das Format)
// ---------------------------------------------------------------------------

export const SceneSchema = z.object({
  start: z.number().describe("Startsekunde"),
  ende: z.number().describe("Endsekunde"),
  bild: z.string().describe("Was ist zu sehen: Einstellung, Perspektive, Handlung"),
  gesprochen: z.string().describe("Wörtlicher Sprechtext dieser Szene (leer, wenn nur Bild)"),
  textEinblendung: z.string().describe("Text-Overlay auf dem Bild, leer wenn keiner"),
  schnittHinweis: z.string(),
  kiPrompt: z
    .string()
    .describe(
      "ENGLISCHER, detaillierter Prompt für einen KI-Videogenerator (Veo/Kling), der genau diese Szene als realistischen vertikalen 9:16-Clip erzeugt: Motiv, Umgebung, Licht, Kamerabewegung, Stil. Kein Text im Bild, keine Logos, keine echten Personen/Marken.",
    ),
});

export const ScriptSchema = z.object({
  titel: z.string(),
  kernidee: z.string(),
  zielplattform: PlatformTarget,
  format: z.string().describe("z. B. Talking Head + B-Roll, POV, Vorher/Nachher, Green Screen"),
  laengeSekunden: z.number(),
  hooks: z
    .array(
      z.object({
        text: z.string().describe("Gesprochener Hook-Satz"),
        typ: z.string().describe("z. B. Neugier, Kontroverse, Fehler, Ergebnis zuerst"),
        visuell: z.string().describe("Was in Sekunde 0-2 zu sehen ist"),
        begruendung: z.string(),
      }),
    )
    .describe("Genau 3 Hook-Varianten, die beste zuerst"),
  szenen: z.array(SceneSchema),
  cta: z.string(),
  caption: z.string(),
  hashtagsTiktok: z.array(z.string()).describe("3-6 Hashtags ohne #"),
  hashtagsInstagram: z.array(z.string()).describe("5-10 Hashtags ohne #"),
  sound: z.string().describe("Sound-/Musikempfehlung inkl. Begründung"),
  postingZeit: z.string(),
  drehTipps: z.array(z.string()),
  warumDasFunktioniert: z.array(z.string()).describe("Begründungen mit Bezug auf Konkurrenz-Daten und Trends"),
  aenderungenZumEntwurf: z
    .array(z.string())
    .describe("Nur beim finalen Skript: was gegenüber dem Entwurf geändert wurde und warum. Beim Entwurf leeres Array."),
  viralScore: z.number().describe("Ehrlich eingeschätztes Viral-Potenzial 0 bis 100"),
});
export type Script = z.infer<typeof ScriptSchema>;

// ---------------------------------------------------------------------------
// Video: Schnittplan & Viral-Rating
// ---------------------------------------------------------------------------

export const EditPlanSchema = z.object({
  konzept: z.string(),
  hookText: z.string().describe("Text-Overlay für die ersten 2-3 Sekunden, maximal 8 Wörter, leer wenn keiner"),
  segmente: z
    .array(
      z.object({
        quelle: z.string().describe("ID des Quellclips, z. B. C1"),
        start: z.number().describe("Sekunde im Quellclip"),
        ende: z.number().describe("Sekunde im Quellclip"),
        zweck: choice(["hook", "inhalt", "beweis", "cta", "broll"], "inhalt"),
        zoom: choice(["kein", "leicht", "punch"], "kein"),
        textEinblendung: z.string().describe("Optionaler Text-Overlay für dieses Segment, sonst leer"),
      }),
    )
    .describe("In Abspielreihenfolge. Nur Bereiche innerhalb der Clip-Dauer."),
  untertitel: z.boolean(),
  zielLaengeSekunden: z.number(),
  begruendung: z.array(z.string()),
});
export type EditPlan = z.infer<typeof EditPlanSchema>;

export const ViralRatingSchema = z.object({
  gesamt: z.number().describe("Viral-Potenzial 0 bis 100. Kalibrierung: Durchschnitt 40-60, über 85 nur bei außergewöhnlichem Material"),
  kategorien: z.object({
    hook: z.number().describe("0-10"),
    retention: z.number().describe("0-10"),
    mehrwert: z.number().describe("0-10"),
    emotion: z.number().describe("0-10"),
    trendFit: z.number().describe("0-10"),
    cta: z.number().describe("0-10"),
    technik: z.number().describe("0-10: Bild, Ton, Untertitel, Format"),
  }),
  urteil: z.string(),
  staerken: z.array(z.string()),
  schwaechen: z.array(z.string()),
  verbesserungen: z.array(
    z.object({
      was: z.string(),
      warum: z.string(),
      prioritaet: choice(["hoch", "mittel", "niedrig"], "mittel"),
    }),
  ),
  caption: z.string(),
  hashtagsTiktok: z.array(z.string()).describe("3-6 Hashtags ohne #, Mischung aus Nische und Reichweite"),
  hashtagsInstagram: z.array(z.string()).describe("5-10 Hashtags ohne #"),
  besteZeit: z.string(),
});
export type ViralRating = z.infer<typeof ViralRatingSchema>;

// ---------------------------------------------------------------------------
// Power-Features
// ---------------------------------------------------------------------------

export const ContentPlanResultSchema = z.object({
  strategie: z.string(),
  saeulen: z.array(
    z.object({
      name: z.string(),
      beschreibung: z.string(),
      anteil: z.number().describe("Anteil in Prozent"),
    }),
  ),
  ideen: z.array(
    z.object({
      titel: z.string(),
      hook: z.string(),
      format: z.string(),
      saeule: z.string(),
      ziel: z.string(),
      plattform: PlatformTarget,
      aufwand: choice(["gering", "mittel", "hoch"], "mittel"),
      tag: z.number().describe("Tag im 30-Tage-Plan, 1 bis 30"),
    }),
  ),
});
export type ContentPlanResult = z.infer<typeof ContentPlanResultSchema>;

export const HookLabSchema = z.object({
  hooks: z.array(
    z.object({
      text: z.string(),
      typ: z.string(),
      visuell: z.string(),
      score: z.number().describe("0-100"),
      warum: z.string(),
    }),
  ),
});
export type HookLab = z.infer<typeof HookLabSchema>;

export const ClipFinderSchema = z.object({
  clips: z.array(
    z.object({
      titel: z.string(),
      start: z.number(),
      ende: z.number(),
      hookText: z.string().describe("Text-Overlay für den Einstieg, max. 8 Wörter"),
      warum: z.string(),
      score: z.number().describe("Viral-Potenzial 0-100"),
    }),
  ),
});
export type ClipFinder = z.infer<typeof ClipFinderSchema>;
