'use strict';

const whois = require('whois');

const DENIC_SERVER = 'whois.denic.de';
const LOOKUP_TIMEOUT_MS = 10000;
const DELAY_BETWEEN_LOOKUPS_MS = 1200; // DENIC rate limitet aggressive Anfragen
const RETRY_DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Führt eine einzelne WHOIS-Rohabfrage gegen den offiziellen
 * DENIC-Whois-Server (whois.denic.de, Port 43) durch.
 * @param {string} domain vollständige Domain, z.B. "beispiel.de"
 * @returns {Promise<string>} Rohtext der Antwort
 */
function rawLookup(domain) {
  return new Promise((resolve, reject) => {
    whois.lookup(
      domain,
      { server: `${DENIC_SERVER}:43`, timeout: LOOKUP_TIMEOUT_MS, follow: 0 },
      (err, data) => {
        if (err) return reject(err);
        resolve(typeof data === 'string' ? data : String(data));
      }
    );
  });
}

/**
 * Interpretiert die DENIC-Whois-Antwort.
 * DENIC antwortet bei freien Domains mit "Status: free", bei vergebenen
 * Domains mit vollständigen Objektdaten (u.a. "Domain:", "Status: connect").
 * @returns {'available'|'taken'|'unknown'}
 */
function interpretDenicResponse(raw) {
  if (!raw) return 'unknown';
  const text = raw.toLowerCase();

  if (/status:\s*free/.test(text)) return 'available';

  if (text.includes('domain:') && (text.includes('status: connect') || text.includes('nserver'))) {
    return 'taken';
  }

  // Fallback: Wenn ein "Domain:"-Feld vorhanden ist, ist die Domain vergeben.
  if (text.includes('domain:')) return 'taken';

  return 'unknown';
}

/**
 * Prüft die Verfügbarkeit einer .de-Domain per DENIC-WHOIS.
 * Führt bei unklarer/Rate-Limit-Antwort einen einmaligen Retry durch.
 *
 * @param {string} domain vollständige Domain, z.B. "beispiel.de"
 * @returns {Promise<{status: 'available'|'taken'|'unknown', raw: string|null, error: string|null}>}
 */
async function checkAvailability(domain) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await rawLookup(domain);
      const status = interpretDenicResponse(raw);
      if (status !== 'unknown') {
        return { status, raw, error: null };
      }
      const lowered = raw.toLowerCase();
      const isRateLimited = lowered.includes('error') || lowered.includes('exceeded') || lowered.includes('rate limit');
      if (isRateLimited && attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { status: 'unknown', raw, error: null };
    } catch (err) {
      if (attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { status: 'unknown', raw: null, error: err.message };
    }
  }
  return { status: 'unknown', raw: null, error: 'Unbekannter Fehler bei der WHOIS-Abfrage' };
}

/**
 * Prüft eine Liste von Domains nacheinander (sequenziell, mit Delay),
 * um die DENIC-Rate-Limits nicht zu verletzen.
 *
 * @param {string[]} domains vollständige Domains, z.B. ["ki.de", "kihub.de"]
 * @param {(done: number, total: number, domain: string) => void} [onProgress]
 * @returns {Promise<Map<string, {status: string, raw: string|null, error: string|null}>>}
 */
async function checkAvailabilityBatch(domains, onProgress) {
  const results = new Map();
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    const result = await checkAvailability(domain);
    results.set(domain, result);
    if (onProgress) onProgress(i + 1, domains.length, domain);
    if (i < domains.length - 1) {
      await sleep(DELAY_BETWEEN_LOOKUPS_MS);
    }
  }
  return results;
}

module.exports = {
  DENIC_SERVER,
  checkAvailability,
  checkAvailabilityBatch,
  interpretDenicResponse,
};
