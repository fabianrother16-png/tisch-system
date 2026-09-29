import { useSyncExternalStore } from 'react';

// Lokale Einstellungen pro Gerät (Ton, Ansager, Streamer-Modus).
const KEY = 'hh:prefs';

function detectLang() {
  try {
    return (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en';
  } catch {
    return 'de';
  }
}

const DEFAULTS = { muted: false, volume: 0.8, announcer: true, streamer: false, profile: null, lang: detectLang(), customCards: null, autoCustom: true };

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

let prefs = load();
const subs = new Set();

export function getPrefs() {
  return prefs;
}

export function setPrefs(patch) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignorieren */
  }
  for (const fn of subs) fn();
}

export function subscribePrefs(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function usePrefs() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => prefs,
  );
}
