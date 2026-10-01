import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { db } from "./index";

let migration: Promise<void> | null = null;

/** Führt ausstehende SQL-Migrationen genau einmal pro Server-Instanz aus. */
export function runMigrations(): Promise<void> {
  if (!migration) {
    migration = migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") }).catch(
      (err) => {
        migration = null;
        throw err;
      },
    );
  }
  return migration;
}
