import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

type DB = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __cockpitClient?: Client;
  __cockpitDb?: DB;
};

function createDbClient(): Client {
  const url = process.env.DATABASE_URL || "file:./data/cockpit.db";
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  if (url.startsWith("file:")) {
    // Fremdschlüssel aktivieren und parallele Zugriffe tolerieren (lokale Datei)
    void client.execute("PRAGMA foreign_keys = ON");
    void client.execute("PRAGMA busy_timeout = 5000");
  }
  return client;
}

export const client: Client = globalForDb.__cockpitClient ?? createDbClient();
export const db: DB = globalForDb.__cockpitDb ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__cockpitClient = client;
  globalForDb.__cockpitDb = db;
}

export { schema };
