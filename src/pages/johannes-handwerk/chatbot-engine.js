import { BOT_FAQ, BOT_FALLBACK } from './data.js';

// ---------------------------------------------------------------------------
// Demo-Chat-Engine: einfache, regelbasierte Antwortlogik auf Keyword-Basis.
// Reicht für die Verkaufs-Demo völlig aus, wirkt aber durch die freundliche,
// lokal-persönliche Formulierung in data.js (BOT_FAQ) wie ein echter
// Mitarbeiter und nicht wie ein generischer Konzern-Bot.
//
// Anbindung an eine echte LLM-API (z. B. Claude über die Anthropic API):
// Diese Funktion ist absichtlich async, damit sie 1:1 durch einen echten
// API-Call ersetzt werden kann, z. B.:
//
//   export async function getBotAnswer(userText, history) {
//     const res = await fetch('/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ message: userText, history }),
//     });
//     const data = await res.json();
//     return { text: data.reply, suggestContact: data.suggestContact };
//   }
//
// Auf der Server-Seite würde man dort z. B. die Anthropic Messages API mit
// einem System-Prompt aufrufen, der Leistungen, Einsatzgebiet und Tonfall
// von Johannes-Handwerk beschreibt (Retrieval der Firmendaten aus data.js).
// ---------------------------------------------------------------------------

const CONTACT_TRIGGER_KEYWORDS = [
  'termin',
  'kostenvoranschlag',
  'angebot',
  'formular',
  'anfrage',
  'kontakt',
  'anrufen',
  'buchen',
];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // Umlaute etc. grob entschärfen für Keyword-Matching
}

export async function getBotAnswer(userText) {
  const normalized = normalize(userText);

  // simulierte kleine Denkpause, damit der Bot nicht "unecht" wirkt
  await new Promise((resolve) => setTimeout(resolve, 450 + Math.random() * 350));

  const rule = BOT_FAQ.find((entry) => entry.keywords.some((kw) => normalized.includes(kw)));
  const suggestContact = CONTACT_TRIGGER_KEYWORDS.some((kw) => normalized.includes(kw));

  if (rule) {
    return { text: rule.answer, suggestContact };
  }
  return { text: BOT_FALLBACK, suggestContact: true };
}
