'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_ENTRIES = 50;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
  }
}

function readHistory() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // Beschädigte/leere Datei -> mit leerer Historie weiterarbeiten,
    // statt die App abstürzen zu lassen.
    return [];
  }
}

function writeHistoryAtomic(entries) {
  ensureDataFile();
  const tmpFile = `${HISTORY_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(entries, null, 2), 'utf8');
  fs.renameSync(tmpFile, HISTORY_FILE);
}

/**
 * Fügt einen neuen Recherche-Eintrag an den Anfang der Historie an
 * und begrenzt die Historie auf MAX_ENTRIES Einträge.
 * @param {{keyword: string, results: object[]}} entry
 * @returns {object} der gespeicherte Eintrag inkl. id/timestamp
 */
function addEntry(entry) {
  const entries = readHistory();
  const stored = {
    id: crypto.randomUUID(),
    keyword: entry.keyword,
    timestamp: new Date().toISOString(),
    results: entry.results,
  };
  entries.unshift(stored);
  writeHistoryAtomic(entries.slice(0, MAX_ENTRIES));
  return stored;
}

/**
 * Liefert eine Kurzübersicht der Historie (ohne die vollen Ergebnislisten),
 * neueste zuerst.
 */
function listSummaries() {
  return readHistory().map((e) => ({
    id: e.id,
    keyword: e.keyword,
    timestamp: e.timestamp,
    resultCount: Array.isArray(e.results) ? e.results.length : 0,
    availableCount: Array.isArray(e.results) ? e.results.filter((r) => r.available === true).length : 0,
  }));
}

function getEntryById(id) {
  return readHistory().find((e) => e.id === id) || null;
}

module.exports = {
  HISTORY_FILE,
  addEntry,
  listSummaries,
  getEntryById,
  readHistory,
};
