'use strict';

/**
 * Domain-Kandidaten-Generator
 * ----------------------------------------------------------------------
 * Erzeugt aus einem Thema/Keyword 15-20 mögliche .de-Domain-Kandidaten:
 * - der reine (normalisierte) Begriff
 * - Wortkombinationen mit gängigen Suffixen (-hub, -labs, -tech, ...)
 * - Wortkombinationen mit gängigen Präfixen (get-, mein-, pro-, ...)
 * - eine kurze Akronym-/Kurzform-Variante
 *
 * Alle Kandidaten werden auf gültige Domain-Label-Zeichen normalisiert
 * (a-z, 0-9, Bindestrich; Umlaute werden transliteriert).
 */

const PREFIXES = ['get', 'mein', 'pro', 'top', 'smart', 'mister'];
const SUFFIXES = ['hub', 'labs', 'tech', 'world', 'pro', 'now', 'store', 'base', 'point', 'wave'];

/**
 * Normalisiert einen beliebigen Nutzer-Input zu einem gültigen
 * Domain-Label-Baustein (nur a-z0-9, keine führenden/abschließenden
 * Sonderzeichen). Umlaute werden transliteriert, übrige diakritische
 * Zeichen (Akzente etc.) via NFKD-Zerlegung entfernt.
 */
function slugify(input) {
  const DIACRITICS_RE = /[\u0300-\u036f]/g;
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Baut eine kurze Akronym-/Kurzform-Variante aus dem Keyword.
 * - Bei mehreren Wörtern: Initialen der Wörter (z.B. "Wasserstoff Antrieb" -> "wa")
 * - Bei einem Wort: erste ~4 Buchstaben als Kurzform
 */
function buildAcronym(words, singleSlug) {
  if (words.length > 1) {
    const initials = words
      .map((w) => slugify(w).charAt(0))
      .filter(Boolean)
      .join('');
    if (initials.length >= 2) return initials;
  }
  if (!singleSlug) return '';
  return singleSlug.slice(0, 4);
}

/**
 * Prüft, ob ein Domain-Label (ohne .de) syntaktisch gültig ist.
 */
function isValidLabel(label) {
  if (!label) return false;
  if (label.length < 2 || label.length > 30) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label);
}

/**
 * Erzeugt 15-20 Domain-Kandidaten (jeweils als Label ohne .de-Endung,
 * z.B. "kihub") für ein gegebenes Thema/Keyword.
 *
 * @param {string} keyword Roher Nutzer-Input, z.B. "KI" oder "Wasserstoff Antrieb"
 * @returns {string[]} Liste eindeutiger Domain-Labels
 */
function generateDomainCandidates(keyword) {
  const rawWords = String(keyword || '').trim().split(/\s+/).filter(Boolean);
  const slug = slugify(keyword);

  if (!slug) return [];

  const candidates = [];
  const add = (label) => {
    if (isValidLabel(label) && !candidates.includes(label)) {
      candidates.push(label);
    }
  };

  // 1) reiner Begriff
  add(slug);

  // 2) Begriff + Suffix (Wortkombination, keine Bindestriche -> "brandable")
  for (const suffix of SUFFIXES) {
    add(`${slug}${suffix}`);
  }

  // 3) Präfix + Begriff (ohne und mit Bindestrich)
  for (const prefix of PREFIXES) {
    add(`${prefix}${slug}`);
    add(`${prefix}-${slug}`);
  }

  // 4) kurze Akronym-/Kurzform-Varianten
  const acronym = buildAcronym(rawWords, slug);
  if (acronym && acronym !== slug) {
    add(acronym);
    add(`${acronym}hub`);
    add(`${acronym}tech`);
  }

  // Auf 15-20 Kandidaten begrenzen (mind. 15, sofern genug generiert wurden)
  return candidates.slice(0, 20);
}

module.exports = {
  slugify,
  isValidLabel,
  generateDomainCandidates,
  PREFIXES,
  SUFFIXES,
};
