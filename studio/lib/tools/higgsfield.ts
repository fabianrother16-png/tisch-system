import "server-only";
import { randomUUID } from "crypto";

/**
 * Higgsfield API (https://docs.higgsfield.ai): asynchrone Generierung.
 * POST https://api.higgsfield.ai/<modell-pfad> → request_id, danach Status abfragen.
 */
const BASE = "https://api.higgsfield.ai";
const MODEL_PATH = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9.-]*){1,5}$/;
const REQUEST_ID = /^[0-9a-f-]{36}$/i;

export function higgsfieldConfigured() {
  return Boolean(process.env.HIGGSFIELD_API_KEY_ID && process.env.HIGGSFIELD_API_KEY_SECRET);
}

function authHeader() {
  if (!higgsfieldConfigured()) throw new Error("Higgsfield ist nicht verbunden (HIGGSFIELD_API_KEY_ID/-SECRET fehlen).");
  return `Key ${process.env.HIGGSFIELD_API_KEY_ID}:${process.env.HIGGSFIELD_API_KEY_SECRET}`;
}

export interface HiggsfieldStatus {
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";
  request_id: string;
  error?: string | null;
  images?: { url: string }[];
  video?: { url: string };
}

async function parse(res: Response) {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail ?? data);
    throw new Error(`Higgsfield ${res.status}: ${detail}`);
  }
  return data;
}

export async function higgsfieldSubmit(model: string, input: Record<string, unknown>) {
  if (!MODEL_PATH.test(model) || model.includes("..")) throw new Error(`Unbekanntes Higgsfield-Modell: ${model}`);
  const res = await fetch(`${BASE}/${model}`, {
    method: "POST",
    headers: {
      authorization: authHeader(),
      "content-type": "application/json",
      "idempotency-key": randomUUID(),
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(30_000),
  });
  return (await parse(res)) as unknown as HiggsfieldStatus;
}

export async function higgsfieldStatus(requestId: string) {
  if (!REQUEST_ID.test(requestId)) throw new Error("Ungültige Request-ID.");
  const res = await fetch(`${BASE}/requests/${requestId}/status`, {
    headers: { authorization: authHeader() },
    signal: AbortSignal.timeout(20_000),
  });
  return (await parse(res)) as unknown as HiggsfieldStatus;
}
