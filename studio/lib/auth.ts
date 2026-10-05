// Läuft in proxy.ts und in Route Handlern – darum nur Web-Crypto, kein "server-only".

export const SESSION_COOKIE = "studio_session";

export function passwordConfigured() {
  return Boolean(process.env.STUDIO_PASSWORD);
}

/** Sitzungs-Token = HMAC des Passworts. Ändert sich das Passwort, sind alle Sitzungen ungültig. */
export async function sessionToken(): Promise<string> {
  const password = process.env.STUDIO_PASSWORD ?? "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("sichtwerk-studio-session-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
