import "server-only";
import dns from "dns/promises";
import net from "net";

const USER_AGENT = "Mozilla/5.0 (compatible; SICHTWERK-Studio/1.0; +https://sichtwerk.de)";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb");
}

/** Nur öffentliche http(s)-Adressen zulassen – das Studio soll keine internen Dienste abfragen. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error(`Ungültige URL: ${raw}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Nur http(s)-Adressen sind erlaubt.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Interne Adressen sind nicht erlaubt.");
  }
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) throw new Error(`Domain nicht gefunden: ${host}`);
  if (addresses.some((a) => isPrivateIp(a.address))) throw new Error("Interne Adressen sind nicht erlaubt.");
  return url;
}

export interface FetchedPage {
  url: string;
  finalUrl: string;
  status: number;
  redirects: string[];
  headers: Headers;
  body: string;
  ms: number;
}

/** Holt eine öffentliche Seite, folgt Weiterleitungen (geprüft) und begrenzt Größe und Dauer. */
export async function fetchPublic(raw: string, opts: { timeoutMs?: number; maxBytes?: number } = {}): Promise<FetchedPage> {
  const { timeoutMs = 15000, maxBytes = 3_000_000 } = opts;
  const started = Date.now();
  const redirects: string[] = [];
  let current = await assertPublicUrl(raw);
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,text/plain,*/*", "accept-language": "de-DE,de;q=0.9" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      redirects.push(`${res.status} → ${location}`);
      current = await assertPublicUrl(new URL(location, current).toString());
      continue;
    }
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const body = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
    return { url: raw, finalUrl: current.toString(), status: res.status, redirects, headers: res.headers, body, ms: Date.now() - started };
  }
  throw new Error("Zu viele Weiterleitungen.");
}

export function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
