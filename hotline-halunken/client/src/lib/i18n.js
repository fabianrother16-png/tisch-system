import { useCallback } from 'react';
import { getPrefs, setPrefs, usePrefs } from './prefs.js';
import { getStore } from './net.js';
import de from '../i18n/de.js';
import en from '../i18n/en.js';

const DICTS = { de, en };

export const LANGUAGES = [
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

function format(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

export function translate(lang, key, vars) {
  const dict = DICTS[lang] || de;
  const text = dict[key] ?? de[key];
  if (text == null) return key;
  return format(text, vars);
}

// Ohne Hook (für Sounds, Poster, Ansagen).
export function t(key, vars) {
  return translate(getPrefs().lang, key, vars);
}

export function useT() {
  const { lang } = usePrefs();
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
}

export function useLang() {
  return usePrefs().lang;
}

export function setLang(lang) {
  setPrefs({ lang });
  document.documentElement.lang = lang;
}

// Geldbeträge in der Sprache des Raums (Karten-Sprache): 1.000 € oder $1,000.
export function money(n, lang = getStore().view?.settings?.lang || getPrefs().lang) {
  const v = Math.round(n || 0);
  if (lang === 'en') return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US')}`;
  return `${v.toLocaleString('de-DE')} €`;
}
