"use client";

// Lokale Datenhaltung des Studios in IndexedDB: Kunden, Projekte, Pläne und
// Medien (Video-Blobs) bleiben im Browser des Nutzers – keine Datenbank, kein
// Server-Setup nötig. Über Export/Import (Einstellungen) lassen sich die Daten
// sichern oder auf einen anderen Rechner umziehen.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { useEffect, useState } from "react";
import type { Asset, Client, ContentPlan, ResearchProject, VideoProject } from "./types";

interface StudioDB extends DBSchema {
  clients: { key: string; value: Client };
  research: { key: string; value: ResearchProject; indexes: { clientId: string } };
  videos: { key: string; value: VideoProject; indexes: { clientId: string } };
  plans: { key: string; value: ContentPlan; indexes: { clientId: string } };
  assets: { key: string; value: Asset };
}

export type StoreName = "clients" | "research" | "videos" | "plans";
type StoreValue = {
  clients: Client;
  research: ResearchProject;
  videos: VideoProject;
  plans: ContentPlan;
};

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<StudioDB>("sichtwerk-studio", 1, {
      upgrade(database) {
        database.createObjectStore("clients", { keyPath: "id" });
        for (const name of ["research", "videos", "plans"] as const) {
          const store = database.createObjectStore(name, { keyPath: "id" });
          store.createIndex("clientId", "clientId");
        }
        database.createObjectStore("assets", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export function uid(prefix = "") {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}${rand}`;
}

// --- Änderungs-Benachrichtigung -------------------------------------------
// Jede Schreiboperation erhöht die Version des Stores; die Hooks lesen dann
// neu. So bleiben alle offenen Ansichten synchron, ohne globalen State.

const listeners = new Map<StoreName, Set<() => void>>();

function notify(store: StoreName) {
  listeners.get(store)?.forEach((fn) => fn());
}

function subscribe(store: StoreName, fn: () => void) {
  if (!listeners.has(store)) listeners.set(store, new Set());
  listeners.get(store)!.add(fn);
  return () => {
    listeners.get(store)?.delete(fn);
  };
}

// --- CRUD -------------------------------------------------------------------

export async function getAll<S extends StoreName>(store: S): Promise<StoreValue[S][]> {
  const items = (await (await db()).getAll(store)) as StoreValue[S][];
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getByClient<S extends Exclude<StoreName, "clients">>(
  store: S,
  clientId: string,
): Promise<StoreValue[S][]> {
  // Untypisierter Zugriff: idb kann den Index-Typ über die Union der Stores
  // nicht auflösen, alle drei Stores haben aber denselben clientId-Index.
  const database = (await db()) as unknown as IDBPDatabase;
  const items = (await database.getAllFromIndex(store, "clientId", clientId)) as StoreValue[S][];
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getOne<S extends StoreName>(store: S, id: string): Promise<StoreValue[S] | undefined> {
  return (await (await db()).get(store, id)) as StoreValue[S] | undefined;
}

export async function put<S extends StoreName>(store: S, value: StoreValue[S]): Promise<StoreValue[S]> {
  const next = { ...value, updatedAt: Date.now() };
  await (await db()).put(store, next as never);
  notify(store);
  return next;
}

/**
 * Liest den aktuellen Stand, wendet `fn` an und speichert. Verhindert, dass
 * parallel laufende Pipeline-Schritte sich gegenseitig Ergebnisse
 * überschreiben (jeder Schritt patcht nur seine Felder).
 */
export async function update<S extends StoreName>(
  store: S,
  id: string,
  fn: (current: StoreValue[S]) => StoreValue[S],
): Promise<StoreValue[S] | undefined> {
  const database = await db();
  const tx = database.transaction(store, "readwrite");
  const current = (await tx.store.get(id)) as StoreValue[S] | undefined;
  if (!current) {
    await tx.done;
    return undefined;
  }
  const next = { ...fn(current), updatedAt: Date.now() };
  await tx.store.put(next as never);
  await tx.done;
  notify(store);
  return next;
}

export async function remove(store: StoreName, id: string) {
  await (await db()).delete(store, id);
  notify(store);
}

export async function removeClientCascade(clientId: string) {
  const [research, videos, plans] = await Promise.all([
    getByClient("research", clientId),
    getByClient("videos", clientId),
    getByClient("plans", clientId),
  ]);
  const assetIds = videos.flatMap((v) => [
    ...v.sources.map((s) => s.assetId),
    ...v.renders.map((r) => r.assetId),
  ]);
  const database = await db();
  const tx = database.transaction(["clients", "research", "videos", "plans", "assets"], "readwrite");
  await Promise.all([
    tx.objectStore("clients").delete(clientId),
    ...research.map((r) => tx.objectStore("research").delete(r.id)),
    ...videos.map((v) => tx.objectStore("videos").delete(v.id)),
    ...plans.map((p) => tx.objectStore("plans").delete(p.id)),
    ...assetIds.map((id) => tx.objectStore("assets").delete(id)),
  ]);
  await tx.done;
  (["clients", "research", "videos", "plans"] as const).forEach(notify);
}

// --- Medien -----------------------------------------------------------------

export async function saveAsset(blob: Blob, name: string): Promise<Asset> {
  const asset: Asset = {
    id: uid("a_"),
    createdAt: Date.now(),
    name,
    type: blob.type,
    size: blob.size,
    blob,
  };
  await (await db()).put("assets", asset);
  return asset;
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  return (await db()).get("assets", id);
}

export async function removeAsset(id: string) {
  await (await db()).delete("assets", id);
}

// --- React-Hooks ------------------------------------------------------------

export function useCollection<S extends StoreName>(store: S, clientId?: string) {
  const [items, setItems] = useState<StoreValue[S][] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const next =
        clientId && store !== "clients"
          ? await getByClient(store as Exclude<StoreName, "clients">, clientId)
          : await getAll(store);
      if (alive) setItems(next as StoreValue[S][]);
    };
    void load();
    const unsub = subscribe(store, () => void load());
    return () => {
      alive = false;
      unsub();
    };
  }, [store, clientId]);
  return items;
}

export function useRecord<S extends StoreName>(store: S, id: string | undefined) {
  const [item, setItem] = useState<StoreValue[S] | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = async () => {
      const next = await getOne(store, id);
      if (alive) setItem(next ?? null);
    };
    void load();
    const unsub = subscribe(store, () => void load());
    return () => {
      alive = false;
      unsub();
    };
  }, [store, id]);
  return item;
}

/** Objekt-URL für ein gespeichertes Medium (wird beim Unmount freigegeben). */
export function useAssetUrl(assetId: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!assetId) return;
    let objectUrl: string | null = null;
    let alive = true;
    void getAsset(assetId).then((asset) => {
      if (!alive || !asset) return;
      objectUrl = URL.createObjectURL(asset.blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId]);
  return url;
}

// --- Backup -----------------------------------------------------------------

export type Backup = {
  version: 1;
  exportedAt: string;
  clients: Client[];
  research: ResearchProject[];
  videos: VideoProject[];
  plans: ContentPlan[];
};

/** Exportiert alle Projektdaten (ohne Video-Dateien) als JSON. */
export async function exportBackup(): Promise<Backup> {
  const [clients, research, videos, plans] = await Promise.all([
    getAll("clients"),
    getAll("research"),
    getAll("videos"),
    getAll("plans"),
  ]);
  return { version: 1, exportedAt: new Date().toISOString(), clients, research, videos, plans };
}

export async function importBackup(data: Backup) {
  if (data?.version !== 1) throw new Error("Unbekanntes Backup-Format.");
  const database = await db();
  const tx = database.transaction(["clients", "research", "videos", "plans"], "readwrite");
  await Promise.all([
    ...data.clients.map((c) => tx.objectStore("clients").put(c)),
    ...data.research.map((r) => tx.objectStore("research").put(r)),
    ...data.videos.map((v) => tx.objectStore("videos").put(v)),
    ...data.plans.map((p) => tx.objectStore("plans").put(p)),
  ]);
  await tx.done;
  (["clients", "research", "videos", "plans"] as const).forEach(notify);
}
