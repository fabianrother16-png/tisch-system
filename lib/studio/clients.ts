import { uid } from "./db";
import type { Client } from "./types";

const PALETTE = ["#C1502E", "#2F6F62", "#3B5BA9", "#8A4FA3", "#B5832B", "#A63D5B", "#2E7DA1"];

export function newClient(): Client {
  const now = Date.now();
  return {
    id: uid("k_"),
    createdAt: now,
    updatedAt: now,
    name: "",
    branche: "",
    zielgruppe: "alle",
    stadt: "",
    region: "DE",
    plattformen: ["tiktok", "instagram"],
    ziel: "kunden",
    usp: "",
    tonalitaet: "nahbar, ehrlich, mit einer Prise Humor",
    cta: "",
    handles: { tiktok: "", instagram: "" },
    notizen: "",
    brand: {
      primary: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      accent: "#F5F1E8",
      captionStyle: "bold",
      watermark: false,
    },
  };
}

export const BRANCHEN_BEISPIELE = [
  "Dachdecker",
  "Elektriker",
  "Friseur",
  "Restaurant",
  "Kfz-Werkstatt",
  "Immobilienmakler",
  "Fitnessstudio",
  "Zahnarztpraxis",
  "Bäckerei",
  "Garten- & Landschaftsbau",
];
