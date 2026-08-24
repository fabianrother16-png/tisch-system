'use strict';

const path = require('path');
const express = require('express');

const { generateDomainCandidates } = require('./lib/domainGenerator');
const { checkAvailabilityBatch } = require('./lib/whois');
const { scoreDomain } = require('./lib/scoring');
const history = require('./lib/history');

const app = express();
const PORT = process.env.PORT || 3000;
const TLD = '.de';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /api/search
 * body: { keyword: string }
 * Generiert Domain-Kandidaten, prüft deren Verfügbarkeit per DENIC-WHOIS,
 * bewertet jeden verfügbaren Kandidaten, sortiert und speichert das
 * Ergebnis in der lokalen Historie.
 */
app.post('/api/search', async (req, res) => {
  const keyword = (req.body && req.body.keyword ? String(req.body.keyword) : '').trim();

  if (!keyword) {
    return res.status(400).json({ error: 'Bitte ein Thema/Keyword angeben.' });
  }
  if (keyword.length > 60) {
    return res.status(400).json({ error: 'Keyword ist zu lang (max. 60 Zeichen).' });
  }

  const labels = generateDomainCandidates(keyword);
  if (labels.length === 0) {
    return res.status(400).json({
      error: 'Aus diesem Keyword konnten keine gültigen Domain-Kandidaten erzeugt werden. Bitte lateinische Buchstaben/Zahlen verwenden.',
    });
  }

  const domains = labels.map((label) => `${label}${TLD}`);

  try {
    const whoisResults = await checkAvailabilityBatch(domains);

    const results = labels.map((label, i) => {
      const domain = domains[i];
      const whois = whoisResults.get(domain) || { status: 'unknown', error: null };
      const available = whois.status === 'available' ? true : whois.status === 'taken' ? false : null;
      const { score, reasoning } = scoreDomain(label, keyword);

      return {
        domain,
        available,
        whoisStatus: whois.status, // 'available' | 'taken' | 'unknown'
        whoisError: whois.error || null,
        score,
        reasoning,
        checkLink: `https://www.strato.de/domains/domain-check/?domain=${encodeURIComponent(domain)}`,
      };
    });

    // Verfügbare Domains zuerst, danach absteigend nach Score sortiert
    results.sort((a, b) => {
      if (a.available !== b.available) {
        if (a.available === true) return -1;
        if (b.available === true) return 1;
        if (a.available === false && b.available === null) return -1;
        if (b.available === false && a.available === null) return 1;
      }
      return b.score - a.score;
    });

    const savedEntry = history.addEntry({ keyword, results });

    res.json({
      id: savedEntry.id,
      keyword,
      timestamp: savedEntry.timestamp,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: `Fehler bei der Recherche: ${err.message}` });
  }
});

/**
 * GET /api/history
 * Kurzübersicht vergangener Recherchen (neueste zuerst).
 */
app.get('/api/history', (req, res) => {
  res.json(history.listSummaries());
});

/**
 * GET /api/history/:id
 * Vollständiges (gespeichertes) Ergebnis einer vergangenen Recherche,
 * ohne erneute WHOIS-Abfrage.
 */
app.get('/api/history/:id', (req, res) => {
  const entry = history.getEntryById(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
  res.json(entry);
});

app.listen(PORT, () => {
  console.log(`Domain-Recherche-Tool läuft auf http://localhost:${PORT}`);
});
