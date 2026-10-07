// Serverseitige Konfiguration des Studios. Alle Schlüssel kommen
// ausschließlich aus Umgebungsvariablen (Vercel → Settings → Environment
// Variables bzw. .env.local) und verlassen nie den Server.

import { timingSafeEqual } from "node:crypto";

export const env = {
  anthropicKey: () => process.env.ANTHROPIC_API_KEY ?? "",
  model: () => process.env.STUDIO_MODEL || "claude-opus-5-5",
  apifyToken: () => process.env.APIFY_API_TOKEN ?? "",
  apifyMaxChargeUsd: () => Number(process.env.APIFY_MAX_CHARGE_USD || "5"),
  elevenLabsKey: () => process.env.ELEVENLABS_API_KEY ?? "",
  falKey: () => process.env.FAL_KEY ?? "",
  password: () => process.env.STUDIO_PASSWORD ?? "",
};

export type ProviderStatus = {
  claude: boolean;
  apify: boolean;
  elevenlabs: boolean;
  fal: boolean;
  passwordRequired: boolean;
  passwordMissingInProduction: boolean;
  model: string;
};

export function providerStatus(): ProviderStatus {
  const isProd = process.env.NODE_ENV === "production";
  return {
    claude: Boolean(env.anthropicKey()),
    apify: Boolean(env.apifyToken()),
    elevenlabs: Boolean(env.elevenLabsKey()),
    fal: Boolean(env.falKey()),
    passwordRequired: Boolean(env.password()),
    passwordMissingInProduction: isProd && !env.password(),
    model: env.model(),
  };
}

export class StudioError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

/**
 * Zugriffsschutz für alle kostenpflichtigen Studio-Routen. Ist
 * STUDIO_PASSWORD gesetzt, muss jeder Request es im Header `x-studio-key`
 * mitschicken. In Produktion ist das Passwort Pflicht – sonst könnte jeder,
 * der die URL kennt, API-Guthaben verbrauchen.
 */
export function assertAccess(request: Request) {
  const password = env.password();
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new StudioError(
        "STUDIO_PASSWORD ist nicht gesetzt. Bitte in den Umgebungsvariablen ein Passwort hinterlegen, bevor das Studio live genutzt wird.",
        503,
      );
    }
    return;
  }
  const given = request.headers.get("x-studio-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(password);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new StudioError("Falsches oder fehlendes Studio-Passwort.", 401);
  }
}

export function requireKey(value: string, name: string, purpose: string) {
  if (!value) {
    throw new StudioError(`${name} fehlt – ${purpose}. Bitte in den Umgebungsvariablen hinterlegen.`, 503);
  }
  return value;
}

export function errorResponse(error: unknown) {
  if (error instanceof StudioError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[studio]", error);
  const message = error instanceof Error ? error.message : "Unbekannter Fehler";
  return Response.json({ error: message }, { status: 500 });
}
