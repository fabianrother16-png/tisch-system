/** Zentrale, typisierte Sicht auf Umgebungsvariablen. */

const DEV_SECRET = "dev-only-secret-bitte-in-produktion-APP_SECRET-setzen-0000";

export function appSecret(): string {
  const secret = process.env.APP_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error(
      "APP_SECRET fehlt oder ist zu kurz (mind. 32 Zeichen). Bitte in den Umgebungsvariablen setzen.",
    );
  }
  return DEV_SECRET;
}

export function appUrl(): string {
  const url = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3100");
  return url.replace(/\/$/, "");
}

export function cronSecret(): string | undefined {
  return process.env.CRON_SECRET || undefined;
}
