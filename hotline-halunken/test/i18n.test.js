import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import de from '../client/src/i18n/de.js';
import en from '../client/src/i18n/en.js';

const SRC = new URL('../client/src/', import.meta.url).pathname;

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'i18n' ? [] : sourceFiles(p);
    return /\.(jsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}

// Schlüssel, die im Code dynamisch zusammengesetzt werden.
const DYNAMIC = [
  ...['victim', 'call', 'hangup', 'razzia'].flatMap((k) => [`home.how.${k}.title`, `home.how.${k}.text`]),
  ...['voice', 'chat'].flatMap((m) => [`lobby.mode.${m}`, `lobby.mode.${m}.hint`]),
  ...['rounds', 'callSeconds', 'maxCallers', 'budget'].map((k) => `lobby.setting.${k}`),
  ...['cop', 'chaos', 'voices', 'audience'].flatMap((k) => [`lobby.toggle.${k}`, `lobby.toggle.${k}.hint`]),
  ...['ice', 'skeptic', 'undecided', 'convinced', 'love'].map((k) => `call.trust.${k}`),
  ...['airhorn', 'kaching', 'typing', 'modem', 'drumroll', 'sad', 'ding', 'buzzer', 'boing'].map((k) => `sound.${k}`),
  ...['mvp', 'coup', 'generous', 'hungup', 'hold', 'detective', 'cop', 'wrong', 'fanfav'].flatMap((k) => [`award.${k}.title`, `award.${k}.desc`]),
  ...['victim', 'scammers', 'calls', 'chat', 'chaos', 'cop', 'win'].flatMap((k) => [`rules.${k}.title`, `rules.${k}.text`]),
  ...['maschen', 'personas'].map((k) => `custom.tab.${k}`),
  ...['emoji', 'title', 'caller', 'pitch'].flatMap((k) => [`custom.field.maschen.${k}`, `custom.ph.maschen.${k}`]),
  ...['emoji', 'name', 'age', 'bio', 'likes', 'hates', 'secret'].flatMap((k) => [`custom.field.personas.${k}`, `custom.ph.personas.${k}`]),
  'summary.hangup', 'summary.timeout', 'summary.skipped',
  'roles.victim.text', 'roles.victim.textChat', 'roles.caller.text', 'roles.caller.textChat',
  'razzia.lead', 'razzia.leadChat',
  'over.reason.tooFew', 'over.reason.hostEnded',
  'notice.kicked', 'notice.otherTab', 'notice.sessionExpired',
  'err.offline', 'err.timeout', 'newHost',
  'poster.rank1', 'poster.rank2', 'poster.rank3',
  'custom.missing', 'custom.saved', 'custom.autoLoaded', 'custom.exported', 'custom.importError', 'lobby.linkCopied',
];

test('Alle benutzten Texte existieren auf Deutsch und Englisch', () => {
  const used = new Set(DYNAMIC);
  for (const file of sourceFiles(SRC)) {
    const code = fs.readFileSync(file, 'utf8');
    for (const m of code.matchAll(/\b(?:t|translateNow)\(\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
  }
  const missing = [...used].filter((k) => !(k in de) || !(k in en));
  assert.deepEqual(missing, [], `Fehlende Übersetzungen: ${missing.join(', ')}`);
});

test('Deutsch und Englisch haben dieselben Schlüssel und Platzhalter', () => {
  assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort());
  for (const key of Object.keys(de)) {
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(vars(en[key]), vars(de[key]), `Platzhalter in ${key}`);
  }
});

test('Spielinhalte: Deutsch und Englisch haben dieselben Karten', async () => {
  const de = await import('../server/content/de.js');
  const en = await import('../server/content/en.js');
  assert.deepEqual(Object.keys(en).sort(), Object.keys(de).sort(), 'gleiche Exporte');
  for (const list of ['MASCHEN', 'PERSONAS', 'VOICES', 'CHAOS']) {
    assert.deepEqual(en[list].map((c) => c.id), de[list].map((c) => c.id), `${list}: gleiche IDs`);
    assert.equal(new Set(de[list].map((c) => c.id)).size, de[list].length, `${list}: IDs eindeutig`);
  }
  assert.deepEqual(en.CHAOS.map((c) => `${c.mode || ''}:${c.target}`), de.CHAOS.map((c) => `${c.mode || ''}:${c.target}`), 'gleiche Modi/Ziele');
  for (const C of [de, en]) {
    for (const m of C.MASCHEN) {
      for (const f of ['emoji', 'title', 'caller', 'pitch']) assert.ok(m[f], `${m.id}.${f}`);
      assert.ok(m.proof?.title && m.proof.lines.length && m.proof.stamp, `${m.id}.proof`);
    }
    for (const p of C.PERSONAS) for (const f of ['emoji', 'name', 'age', 'bio', 'likes', 'hates', 'secret', 'savings']) assert.ok(p[f], `${p.id}.${f}`);
    for (const c of C.CHAOS) assert.ok(!/\{(?!caller\}|victim\})/.test(c.text), `Platzhalter in ${c.id}`);
    assert.match(C.fakeNumber(), /^\+\d/);
    assert.ok(C.customProof('Test').title.length <= 40);
  }
});
