// ---------------------------------------------------------------------------
// Regelbasierte Antworten für das Chat-Widget
// ---------------------------------------------------------------------------
// Diese einfache Keyword-Logik beantwortet die häufigsten Fragen (Preise,
// Referenzen, Terminanfragen, Kontakt, Leistungen). Sie läuft aktuell
// komplett ohne externe KI und lässt sich in app/api/chat/route.ts 1:1 durch
// einen Aufruf an einen echten KI-Dienst ersetzen (z.B. die Anthropic API) –
// dazu einfach `getRuleBasedReply()` dort gegen einen Modellaufruf tauschen.
// ---------------------------------------------------------------------------

import { company, services } from "./content";

interface Rule {
  id: string;
  keywords: string[];
  reply: string;
}

const rules: Rule[] = [
  {
    id: "preise",
    keywords: [
      "preis",
      "preise",
      "kosten",
      "kostet",
      "budget",
      "angebot",
      "was zahl",
    ],
    reply:
      "Die Kosten hängen stark von Fläche, Material und Untergrund ab, daher geben wir online keine Pauschalpreise an. " +
      `Am schnellsten geht's mit einem kostenlosen Vor-Ort-Termin: Rufen Sie uns unter ${company.phone} an oder ` +
      "nutzen Sie das Kontaktformular weiter unten – wir melden uns mit einem fairen, festen Angebot zurück.",
  },
  {
    id: "referenzen",
    keywords: ["referenz", "referenzen", "beispiel", "vorher", "bilder", "fotos", "projekt"],
    reply:
      "Einen Eindruck unserer Arbeiten finden Sie in der Referenzgalerie weiter oben auf dieser Seite. " +
      "Weitere aktuelle Projektfotos zeigen wir Ihnen gerne auch persönlich beim Beratungstermin.",
  },
  {
    id: "termin",
    keywords: ["termin", "besichtigung", "vor-ort", "vor ort", "wann könnt", "verfügbar", "zeit"],
    reply:
      "Gerne vereinbaren wir einen Vor-Ort-Termin für eine unverbindliche Beratung. " +
      `Am schnellsten erreichen Sie uns telefonisch unter ${company.phone} oder per E-Mail an ${company.email}. ` +
      "Alternativ können Sie auch direkt das Kontaktformular ausfüllen – wir melden uns kurzfristig zurück.",
  },
  {
    id: "kontakt",
    keywords: ["kontakt", "erreichen", "telefon", "anrufen", "email", "e-mail", "mail"],
    reply: `Sie erreichen uns telefonisch unter ${company.phone} oder per E-Mail an ${company.email}. Unser Büro finden Sie am Blumenkamp 13, 44369 Dortmund.`,
  },
  {
    id: "leistungen",
    keywords: ["leistung", "leistungen", "was macht ihr", "was bietet", "service", "services", "anbieten"],
    reply:
      "Unsere Leistungen umfassen: " +
      services.map((s) => s.title).join(", ") +
      ". Mehr Details finden Sie im Bereich „Leistungen“ auf dieser Seite.",
  },
  {
    id: "bad",
    keywords: ["bad", "badezimmer", "dusche", "barrierefrei"],
    reply:
      "Ob klassisches Badezimmer oder barrierefreie, bodengleiche Dusche – wir planen und verlegen Ihr Traumbad " +
      "von der Beratung bis zur Silikonfuge aus einer Hand. Am besten besprechen wir Details in einem persönlichen Termin.",
  },
  {
    id: "terrasse",
    keywords: ["terrasse", "balkon", "außenbereich", "garten"],
    reply:
      "Für Balkone und Terrassen verlegen wir frostsichere, wetterbeständige Fliesen und Naturstein im fachgerechten Gefälle. " +
      "Erzählen Sie uns gerne mehr zu Ihrem Vorhaben über das Kontaktformular.",
  },
  {
    id: "naturstein",
    keywords: ["naturstein", "marmor", "granit", "schiefer"],
    reply:
      "Wir arbeiten mit Naturstein wie Marmor, Granit und Schiefer für Böden, Wände und Arbeitsplatten. " +
      "Da jede Steinart unterschiedlich verarbeitet wird, beraten wir Sie dazu am liebsten persönlich.",
  },
  {
    id: "gruss",
    keywords: ["hallo", "hi", "guten tag", "moin", "servus"],
    reply:
      `Hallo! Schön, dass Sie da sind 👋 Ich bin der Chat-Assistent von ${company.name}. ` +
      "Fragen Sie mich gerne zu Preisen, Referenzen oder Terminen – oder nutzen Sie direkt das Kontaktformular.",
  },
  {
    id: "danke",
    keywords: ["danke", "dankeschön", "super", "klasse"],
    reply: "Sehr gerne! Wenn Sie weitere Fragen haben, bin ich jederzeit für Sie da.",
  },
];

const fallbackReply =
  "Das kann ich Ihnen im Chat nicht abschließend beantworten. " +
  `Am besten wenden Sie sich direkt an uns: ${company.phone} oder ${company.email} – ` +
  "oder nutzen Sie das Kontaktformular weiter unten auf der Seite.";

export function getRuleBasedReply(userMessage: string): string {
  const normalized = userMessage.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.reply;
    }
  }

  return fallbackReply;
}
