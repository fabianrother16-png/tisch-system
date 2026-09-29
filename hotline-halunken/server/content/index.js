import * as de from './de.js';
import * as en from './en.js';

export const LANGS = ['de', 'en'];
const CONTENT = { de, en };

export function getContent(lang) {
  return CONTENT[lang] || de;
}
