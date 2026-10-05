import "server-only";
import { randomBytes, randomUUID } from "crypto";
import { getStore } from "./store";
import {
  CLIENT_STATUS,
  CLIENT_TEXT_FIELDS,
  EMPTY_USAGE,
  OUTPUT_STATUS,
  PAKET_IDS,
  isSegmentSlug,
  type Client,
  type Output,
  type SegmentSlug,
  type Settings,
} from "./types";

const CLIENTS = "clients";
const OUTPUTS = "outputs";
const SETTINGS = "settings";

export const DEFAULT_MODEL = "claude-opus-5-5";

export const DEFAULT_SETTINGS: Settings = {
  agenturName: "SICHTWERK",
  agenturOrt: "Gütersloh",
  agenturWebsite: "https://sichtwerk.de",
  agenturInfo: "",
  preisliste: "",
  team: [],
  model: DEFAULT_MODEL,
  webhookUrl: "",
};

const now = () => new Date().toISOString();
export const newId = () => randomUUID();

// ── Kunden ──────────────────────────────────────────────────────────────────

export async function listClients(): Promise<Client[]> {
  const all = await getStore().list<Client>(CLIENTS);
  return all.sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export async function getClient(id: string) {
  return getStore().get<Client>(CLIENTS, id);
}

/** Übernimmt nur bekannte Felder aus Formular-/API-Eingaben. */
export function sanitizeClientInput(input: Record<string, unknown>, base?: Client): Client {
  const c: Client = base
    ? { ...base }
    : {
        id: newId(),
        ...(Object.fromEntries(CLIENT_TEXT_FIELDS.map((f) => [f, ""])) as Pick<
          Client,
          (typeof CLIENT_TEXT_FIELDS)[number]
        >),
        status: "onboarding",
        paket: "starter",
        leistungen: [],
        createdAt: now(),
        updatedAt: now(),
      };
  for (const f of CLIENT_TEXT_FIELDS) {
    if (typeof input[f] === "string") c[f] = (input[f] as string).slice(0, 5000);
  }
  if ((CLIENT_STATUS as readonly unknown[]).includes(input.status)) c.status = input.status as Client["status"];
  if ((PAKET_IDS as readonly unknown[]).includes(input.paket)) c.paket = input.paket as Client["paket"];
  if (Array.isArray(input.leistungen)) c.leistungen = input.leistungen.filter(isSegmentSlug);
  c.name = c.name.trim();
  c.updatedAt = now();
  return c;
}

export async function saveClient(client: Client) {
  await getStore().put(CLIENTS, client);
  return client;
}

export async function deleteClient(id: string) {
  await getStore().remove(CLIENTS, id);
  // Ergebnisse bleiben erhalten, verlieren aber die Zuordnung.
  for (const o of await listOutputs({ clientId: id })) {
    await saveOutput({ ...o, clientId: null });
  }
}

// ── Ergebnisse ──────────────────────────────────────────────────────────────

export async function listOutputs(filter: { clientId?: string; segment?: SegmentSlug } = {}) {
  const all = await getStore().list<Output>(OUTPUTS);
  return all
    .filter((o) => (filter.clientId ? o.clientId === filter.clientId : true))
    .filter((o) => (filter.segment ? o.segment === filter.segment : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOutput(id: string) {
  return getStore().get<Output>(OUTPUTS, id);
}

export async function findOutputByToken(token: string) {
  if (!token || token.length < 20) return null;
  const all = await getStore().list<Output>(OUTPUTS);
  return all.find((o) => o.freigabeToken === token) ?? null;
}

export function newOutput(fields: Partial<Output> & Pick<Output, "segment" | "title">): Output {
  return {
    id: newId(),
    clientId: null,
    prompt: "",
    content: "",
    status: "entwurf",
    zustaendig: "",
    geplantAm: null,
    quellen: [],
    versionen: [],
    pruefbericht: null,
    freigabeToken: null,
    kundenFeedback: [],
    usage: { ...EMPTY_USAGE },
    kostenUsd: 0,
    model: null,
    createdAt: now(),
    updatedAt: now(),
    ...fields,
  };
}

export async function saveOutput(output: Output) {
  output.updatedAt = now();
  await getStore().put(OUTPUTS, output);
  return output;
}

export async function deleteOutput(id: string) {
  await getStore().remove(OUTPUTS, id);
}

/** Übernimmt erlaubte Änderungen aus der UI (Status, Zuständigkeit, Termin, Titel, Inhalt). */
export function applyOutputPatch(o: Output, patch: Record<string, unknown>): Output {
  const next = { ...o };
  if (typeof patch.title === "string" && patch.title.trim()) next.title = patch.title.trim().slice(0, 200);
  if (typeof patch.zustaendig === "string") next.zustaendig = patch.zustaendig.slice(0, 80);
  if (patch.geplantAm === null || (typeof patch.geplantAm === "string" && /^\d{4}-\d{2}-\d{2}$/.test(patch.geplantAm)))
    next.geplantAm = (patch.geplantAm as string | null) || null;
  if ((OUTPUT_STATUS as readonly unknown[]).includes(patch.status)) next.status = patch.status as Output["status"];
  if (typeof patch.prompt === "string") next.prompt = patch.prompt.slice(0, 20000);
  if (patch.clientId === null || typeof patch.clientId === "string") next.clientId = (patch.clientId as string) || null;
  if (typeof patch.content === "string" && patch.content !== o.content) {
    if (o.content) next.versionen = [{ content: o.content, createdAt: o.updatedAt }, ...o.versionen].slice(0, 10);
    next.content = patch.content;
  }
  return next;
}

export function newFreigabeToken() {
  return randomBytes(24).toString("base64url");
}

// ── Einstellungen ───────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const s = await getStore().get<Settings & { id: string }>(SETTINGS, "main");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}

export async function saveSettings(input: Record<string, unknown>) {
  const current = await getSettings();
  const next: Settings = { ...current };
  for (const key of ["agenturName", "agenturOrt", "agenturWebsite", "agenturInfo", "preisliste", "model", "webhookUrl"] as const) {
    if (typeof input[key] === "string") next[key] = (input[key] as string).trim().slice(0, 10000);
  }
  if (Array.isArray(input.team)) {
    next.team = input.team.filter((t): t is string => typeof t === "string" && t.trim() !== "").map((t) => t.trim());
  }
  if (next.webhookUrl && !/^https:\/\//.test(next.webhookUrl)) next.webhookUrl = "";
  if (!next.model) next.model = DEFAULT_MODEL;
  await getStore().put(SETTINGS, { id: "main", ...next });
  return next;
}
