import type { Usage } from "./types";

export interface ModelOption {
  id: string;
  label: string;
  hinweis: string;
  /** USD pro 1 Mio. Tokens */
  input: number;
  output: number;
  cacheRead: number;
}

// Preise: Anthropic-Listenpreise (Stand September 2026). Cache-Schreiben = 1,25 × Input.
export const MODELS: ModelOption[] = [
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5",
    hinweis: "Empfohlen – beste Qualität für Agenturarbeit",
    input: 4,
    output: 20,
    cacheRead: 0.2,
  },
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    hinweis: "Schneller und etwa halb so teuer",
    input: 2,
    output: 10,
    cacheRead: 0.2,
  },
  {
    id: "claude-fable-5-1",
    label: "Claude Fable 5.1",
    hinweis: "Maximum für sehr anspruchsvolle Recherchen – deutlich teurer",
    input: 10,
    output: 50,
    cacheRead: 0.25,
  },
];

// Fallback-Modelle, die bei einer Sicherheitsablehnung serverseitig einspringen können.
const EXTRA_PRICES: Record<string, Pick<ModelOption, "input" | "output" | "cacheRead">> = {
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
};

const WEB_SEARCH_USD = 0.01; // 10 USD pro 1.000 Suchen

function priceFor(model: string | null | undefined) {
  if (!model) return MODELS[0];
  const exact = MODELS.find((m) => m.id === model) ?? EXTRA_PRICES[model];
  if (exact) return exact;
  const prefix = [...MODELS.map((m) => [m.id, m] as const), ...Object.entries(EXTRA_PRICES)].find(([id]) =>
    model.startsWith(id),
  );
  return prefix ? prefix[1] : MODELS[0];
}

export function costUsd(usage: Usage, model: string | null | undefined) {
  const p = priceFor(model);
  const perToken = (usd: number) => usd / 1_000_000;
  return (
    usage.inputTokens * perToken(p.input) +
    usage.cacheWriteTokens * perToken(p.input * 1.25) +
    usage.cacheReadTokens * perToken(p.cacheRead) +
    usage.outputTokens * perToken(p.output) +
    usage.webSearches * WEB_SEARCH_USD
  );
}

export function formatUsd(value: number) {
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
}
