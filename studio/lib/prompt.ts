import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { loadGrundregeln, loadPlaybook } from "./agents";
import { kundenakteText } from "./kundenakte";
import { TOOL_LABELS, type Segment, type StudioTool } from "./segments";
import type { Client, Settings } from "./types";

function agenturKontext(s: Settings) {
  const lines = [
    "## Agentur-Angaben (aktuell)",
    `Name: ${s.agenturName} · Sitz: ${s.agenturOrt}${s.agenturWebsite ? ` · Website: ${s.agenturWebsite}` : ""}`,
  ];
  if (s.team.length) lines.push(`Team: ${s.team.join(", ")}`);
  if (s.agenturInfo) lines.push(`Weitere Informationen:\n${s.agenturInfo}`);
  lines.push(
    s.preisliste
      ? `Preisliste / Pakete (für Angebote verbindlich):\n${s.preisliste}`
      : "Preisliste: nicht hinterlegt – in Angeboten Platzhalter wie [Preis] verwenden.",
  );
  return lines.join("\n");
}

function werkzeugHinweis(segment: Segment, studioTools: StudioTool[]) {
  const lines = [
    "## Werkzeuge in diesem Lauf",
    "- Websuche (web_search) und Webseiten abrufen (web_fetch)",
    ...studioTools.map((t) => `- ${TOOL_LABELS[t]} (${t})`),
  ];
  const fehlend = segment.tools.filter((t) => !studioTools.includes(t));
  if (fehlend.length) {
    lines.push(
      `Nicht verbunden: ${fehlend.map((t) => TOOL_LABELS[t]).join(", ")}. Nutze stattdessen Websuche und Webabruf, kennzeichne Lücken ehrlich und erwähne am Ende in einem Satz, dass mit verbundenen Live-Daten eine genauere Analyse möglich ist.`,
    );
  }
  return lines.join("\n");
}

/**
 * System-Prompt in zwei Blöcken: Grundregeln + Agentur (selten geändert) und das Segment-Playbook.
 * Volatile Inhalte (Datum, Kunde, Auftrag) stehen in der Nutzernachricht, damit der Cache greift.
 */
export async function buildSystem(
  segment: Segment,
  settings: Settings,
  studioTools: StudioTool[],
): Promise<Anthropic.Beta.BetaTextBlockParam[]> {
  const [grundregeln, playbook] = await Promise.all([loadGrundregeln(), loadPlaybook(segment.slug)]);
  return [
    { type: "text", text: `${grundregeln}\n\n${agenturKontext(settings)}` },
    { type: "text", text: `# Dein Fachgebiet: ${segment.label}\n\n${playbook}\n\n${werkzeugHinweis(segment, studioTools)}` },
  ];
}

export interface UserMessageInput {
  client: Client | null;
  auftrag: string;
  bisherigeVersion?: string;
  zuPruefen?: { titel: string; segment: string; inhalt: string };
}

export function buildUserMessage({ client, auftrag, bisherigeVersion, zuPruefen }: UserMessageInput) {
  const heute = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
  const parts = [`Heute ist ${heute}.`];
  parts.push(
    client
      ? `<kundenakte>\n${kundenakteText(client)}\n</kundenakte>`
      : "Kein Kunde ausgewählt – der Auftrag ist für SICHTWERK selbst bzw. allgemein.",
  );
  if (zuPruefen) {
    parts.push(
      `<zu_pruefender_inhalt titel="${zuPruefen.titel.replace(/"/g, "'")}" segment="${zuPruefen.segment}">\n${zuPruefen.inhalt}\n</zu_pruefender_inhalt>`,
    );
  }
  if (bisherigeVersion) {
    parts.push(`<bisherige_version>\n${bisherigeVersion}\n</bisherige_version>`);
    parts.push(
      `<auftrag>\nÜberarbeite die bisherige Version nach diesem Wunsch und liefere die komplette überarbeitete Fassung (nicht nur die Änderungen):\n${auftrag}\n</auftrag>`,
    );
  } else {
    parts.push(`<auftrag>\n${auftrag}\n</auftrag>`);
  }
  return parts.join("\n\n");
}
