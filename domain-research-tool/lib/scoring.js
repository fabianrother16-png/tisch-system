'use strict';

const { PREFIXES, SUFFIXES } = require('./domainGenerator');

/**
 * Scoring-Regel-Engine
 * ----------------------------------------------------------------------
 * WICHTIG: Dies ist eine transparente, rein regelbasierte Heuristik zur
 * groben Einordnung von Domain-Kandidaten. Sie trifft KEINE
 * Marktprognose und KEINE Zukunftsvorhersage über tatsächliche
 * Wiederverkaufswerte – sie bewertet lediglich formale/strukturelle
 * Eigenschaften des Domain-Namens nach fest hinterlegten Regeln.
 *
 * Die Liste der "wachstumsstarken Branchen" ist bewusst im Code
 * gepflegt und kann hier jederzeit erweitert werden.
 */
const GROWTH_INDUSTRIES = [
  {
    name: 'Künstliche Intelligenz',
    keywords: ['ki', 'ai', 'intelligenz', 'robot', 'automation', 'algo', 'neural', 'deep', 'machine', 'gpt', 'llm'],
  },
  {
    name: 'Robotik',
    keywords: ['robot', 'robotik', 'automat', 'drohne', 'drone', 'cobot'],
  },
  {
    name: 'Energie / Wasserstoff',
    keywords: ['wasserstoff', 'hydrogen', 'energie', 'solar', 'wind', 'battery', 'akku', 'strom', 'green', 'klima', 'power'],
  },
  {
    name: 'Biotech',
    keywords: ['bio', 'gen', 'pharma', 'medtech', 'health', 'diagnost', 'zell', 'protein', 'medizin'],
  },
  {
    name: 'Quantencomputing',
    keywords: ['quanten', 'quantum', 'qubit', 'computing'],
  },
];

function findMatchingIndustry(domainLabel, keywordRaw) {
  const haystacks = [domainLabel.toLowerCase(), String(keywordRaw || '').toLowerCase()];
  for (const industry of GROWTH_INDUSTRIES) {
    for (const kw of industry.keywords) {
      if (haystacks.some((h) => h.includes(kw))) {
        return industry;
      }
    }
  }
  return null;
}

/**
 * Längste zusammenhängende Konsonantenfolge in einem rein alphabetischen
 * String (a-z), als grobes Aussprechbarkeits-Signal.
 */
function longestConsonantRun(letters) {
  let max = 0;
  let current = 0;
  for (const ch of letters) {
    if ('aeiou'.includes(ch)) {
      current = 0;
    } else {
      current += 1;
      max = Math.max(max, current);
    }
  }
  return max;
}

/**
 * Bewertet einen Domain-Kandidaten nach transparenten, nachvollziehbaren
 * Regeln. Liefert einen Score von 1-10 sowie eine Liste der Gründe,
 * aus denen sich der Score zusammensetzt.
 *
 * @param {string} domainLabel Domain-Label ohne .de, z.B. "kihub"
 * @param {string} keywordRaw ursprüngliches Nutzer-Keyword
 * @returns {{score: number, reasons: string[], reasoning: string}}
 */
function scoreDomain(domainLabel, keywordRaw) {
  const label = domainLabel.toLowerCase();
  const reasons = [];
  let points = 5; // neutraler Basiswert

  // 1) Länge
  const len = label.length;
  if (len <= 6) {
    points += 2;
    reasons.push(`sehr kurz (${len} Zeichen)`);
  } else if (len <= 9) {
    points += 1.5;
    reasons.push(`kurz (${len} Zeichen, <10)`);
  } else if (len <= 14) {
    points += 0.5;
    reasons.push(`mittlere Länge (${len} Zeichen)`);
  } else {
    points -= 1;
    reasons.push(`eher lang (${len} Zeichen)`);
  }

  // 2) Bindestriche / Zahlen
  const hasHyphen = label.includes('-');
  const hasNumber = /[0-9]/.test(label);
  if (!hasHyphen && !hasNumber) {
    points += 1;
    reasons.push('keine Bindestriche/Zahlen');
  } else {
    if (hasHyphen) {
      points -= 0.5;
      reasons.push('enthält Bindestrich');
    }
    if (hasNumber) {
      points -= 0.5;
      reasons.push('enthält Zahl');
    }
  }

  // 3) Aussprechbarkeit / Merkbarkeit (Vokal-Konsonant-Heuristik)
  const letters = label.replace(/[^a-z]/g, '');
  const vowelCount = (letters.match(/[aeiou]/g) || []).length;
  const vowelRatio = letters.length ? vowelCount / letters.length : 0;
  const maxConsonantRun = longestConsonantRun(letters);
  const isPronounceable = letters.length > 0 && vowelRatio >= 0.3 && vowelRatio <= 0.6 && maxConsonantRun <= 3;
  if (isPronounceable) {
    points += 1.5;
    reasons.push('gut aussprechbar (ausgewogenes Vokal-/Konsonanten-Verhältnis)');
  } else {
    reasons.push('Aussprache ggf. schwieriger (unausgewogenes Vokal-/Konsonanten-Verhältnis)');
  }

  // 4) Themenbezug zu wachstumsstarken Branchen (Liste im Code, s.o.)
  const industry = findMatchingIndustry(label, keywordRaw);
  if (industry) {
    points += 1.5;
    reasons.push(`Themenbezug zu Wachstumsbranche „${industry.name}“`);
  } else {
    reasons.push('kein erkennbarer Bezug zu hinterlegten Wachstumsbranchen');
  }

  // 5) Generischer Begriff vs. Markenname
  const usedGenericSuffix = SUFFIXES.some((s) => label.endsWith(s) && label !== s);
  const usedBrandPrefix = PREFIXES.some((p) => label.startsWith(p) && label !== p);
  const isPureTerm = !usedGenericSuffix && !usedBrandPrefix;
  if (isPureTerm) {
    points += 1;
    reasons.push('generischer/reiner Begriff – potenziell höherer Wiederverkaufswert');
  } else if (usedBrandPrefix && !usedGenericSuffix) {
    reasons.push('eher markenartiger Name (Produkt-/Startup-Charakter) – tendenziell geringerer Wiederverkaufswert als generische Begriffe');
  } else {
    reasons.push('Wortkombination mit generischem Suffix – moderates Wiederverkaufspotenzial');
    points += 0.5;
  }

  const score = Math.min(10, Math.max(1, Math.round(points)));
  const reasoning = `${reasons.join('; ')} (regelbasierte Heuristik, keine Markt- oder Zukunftsprognose)`;

  return { score, reasons, reasoning };
}

module.exports = {
  GROWTH_INDUSTRIES,
  scoreDomain,
  findMatchingIndustry,
};
