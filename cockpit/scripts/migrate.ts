/* Führt ausstehende Datenbank-Migrationen aus (passiert sonst automatisch beim Serverstart). */
import { runMigrations } from "../lib/db/migrate";

await runMigrations();
console.log("Datenbank ist auf dem neuesten Stand.");
