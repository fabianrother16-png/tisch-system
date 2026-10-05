import { getPaket } from "./pakete";
import { getSegment } from "./segments";
import type { Client } from "./types";

const FELDER: [keyof Client, string][] = [
  ["branche", "Branche"],
  ["ort", "Ort / Einzugsgebiet"],
  ["website", "Website"],
  ["googleProfil", "Google-Unternehmensprofil"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["facebook", "Facebook"],
  ["linkedin", "LinkedIn"],
  ["ansprechpartner", "Ansprechpartner"],
  ["zielgruppe", "Zielgruppe"],
  ["angebot", "Angebot / Leistungen / Produkte"],
  ["usp", "Besonderheiten (USP)"],
  ["tonalitaet", "Tonalität & Ansprache"],
  ["farben", "Farben & Gestaltung"],
  ["wettbewerber", "Wettbewerber"],
  ["keywords", "Wichtige Suchbegriffe"],
  ["dosDonts", "Dos & Don'ts"],
  ["notizen", "Notizen"],
];

/** Kundenakte als Text – für die Agenten und zum Kopieren in Claude. */
export function kundenakteText(client: Client) {
  const paket = getPaket(client.paket);
  const leistungen =
    client.paket === "individuell"
      ? client.leistungen.map((s) => getSegment(s)?.label ?? s).join(", ")
      : paket?.beschreibung;
  const lines = [`Kunde: ${client.name}`, `Status: ${client.status}`, `Paket: ${paket?.label ?? client.paket}${leistungen ? ` (${leistungen})` : ""}`];
  for (const [key, label] of FELDER) {
    const value = String(client[key] ?? "").trim();
    if (value) lines.push(`${label}: ${value}`);
  }
  return lines.join("\n");
}
