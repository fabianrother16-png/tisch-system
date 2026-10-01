import { createHash, timingSafeEqual } from "node:crypto";
import { decrypt } from "./crypto";
import { getSetting } from "./settings";
import { addDays, dayOfWeek } from "./dates";

/** Schlüssel, mit dem die Website Anfragen übergibt (Einstellungen, ersatzweise Umgebungsvariable). */
export async function websiteKey(): Promise<string> {
  const s = await getSetting("website");
  return decrypt(s.key) || process.env.WEBSITE_SCHLUESSEL || "";
}

export function sameSecret(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Nächster Werktag (Mo–Fr) nach dem angegebenen Datum */
export function nextWorkday(iso: string): string {
  let d = addDays(iso, 1);
  while (dayOfWeek(d) > 4) d = addDays(d, 1);
  return d;
}
