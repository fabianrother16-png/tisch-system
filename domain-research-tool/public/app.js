(() => {
  const form = document.getElementById('search-form');
  const input = document.getElementById('keyword-input');
  const button = document.getElementById('search-button');
  const statusLine = document.getElementById('status-line');
  const resultsSection = document.getElementById('results-section');
  const resultsHeading = document.getElementById('results-heading');
  const resultsBody = document.getElementById('results-body');
  const historyList = document.getElementById('history-list');

  function setStatus(text, isError) {
    statusLine.textContent = text || '';
    statusLine.classList.toggle('error', Boolean(isError));
  }

  function availabilityCell(result) {
    if (result.available === true) return { text: 'Ja', cls: 'avail-yes' };
    if (result.available === false) return { text: 'Nein', cls: 'avail-no' };
    return { text: 'Unbekannt', cls: 'avail-unknown' };
  }

  function renderResults(keyword, results) {
    resultsHeading.textContent = `Ergebnisse für „${keyword}“ (${results.length} Kandidaten, verfügbare zuerst nach Score sortiert)`;
    resultsBody.innerHTML = '';

    for (const r of results) {
      const tr = document.createElement('tr');
      const avail = availabilityCell(r);

      const domainTd = document.createElement('td');
      domainTd.className = 'domain-cell';
      domainTd.textContent = r.domain;

      const availTd = document.createElement('td');
      const availSpan = document.createElement('span');
      availSpan.className = avail.cls;
      availSpan.textContent = avail.text;
      availTd.appendChild(availSpan);
      if (r.whoisStatus === 'unknown') {
        const small = document.createElement('div');
        small.style.fontSize = '0.75rem';
        small.style.color = '#8a6d00';
        small.textContent = r.whoisError ? `WHOIS-Fehler: ${r.whoisError}` : 'WHOIS-Antwort nicht eindeutig auswertbar';
        availTd.appendChild(small);
      }

      const scoreTd = document.createElement('td');
      const scoreBadge = document.createElement('span');
      scoreBadge.className = 'score-badge';
      scoreBadge.textContent = r.score;
      scoreTd.appendChild(scoreBadge);

      const reasoningTd = document.createElement('td');
      reasoningTd.className = 'reasoning-cell';
      reasoningTd.textContent = r.reasoning;

      const linkTd = document.createElement('td');
      const link = document.createElement('a');
      link.className = 'buy-link';
      link.href = r.checkLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Bei Strato prüfen →';
      linkTd.appendChild(link);

      tr.append(domainTd, availTd, scoreTd, reasoningTd, linkTd);
      resultsBody.appendChild(tr);
    }

    resultsSection.hidden = false;
  }

  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      if (!res.ok) return;
      const items = await res.json();
      historyList.innerHTML = '';

      if (items.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-hint';
        li.textContent = 'Noch keine gespeicherten Recherchen.';
        historyList.appendChild(li);
        return;
      }

      for (const item of items) {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.dataset.id = item.id;

        const keywordSpan = document.createElement('span');
        keywordSpan.className = 'h-keyword';
        keywordSpan.textContent = item.keyword;

        const metaSpan = document.createElement('span');
        metaSpan.className = 'h-meta';
        const date = new Date(item.timestamp);
        metaSpan.textContent = `${date.toLocaleString('de-DE')} · ${item.availableCount}/${item.resultCount} verfügbar`;

        li.append(keywordSpan, metaSpan);
        li.addEventListener('click', () => loadHistoryEntry(item.id));
        historyList.appendChild(li);
      }
    } catch (err) {
      // Historie ist ein Zusatzfeature - Fehler hier sollen die Suche nicht blockieren
      console.warn('Historie konnte nicht geladen werden:', err);
    }
  }

  async function loadHistoryEntry(id) {
    setStatus('Lade gespeicherte Recherche …');
    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unbekannter Fehler');
      input.value = data.keyword;
      renderResults(data.keyword, data.results);
      setStatus(`Aus Historie geladen: ${new Date(data.timestamp).toLocaleString('de-DE')}`);
    } catch (err) {
      setStatus(`Fehler: ${err.message}`, true);
    }
  }

  async function runSearch(keyword) {
    button.disabled = true;
    setStatus('Generiere Domain-Kandidaten und prüfe Verfügbarkeit bei DENIC (whois.denic.de) – das kann wegen Rate-Limits einige Sekunden dauern …');
    resultsSection.hidden = true;

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unbekannter Fehler');

      renderResults(data.keyword, data.results);
      setStatus(`Fertig: ${data.results.length} Kandidaten geprüft am ${new Date(data.timestamp).toLocaleString('de-DE')}.`);
      loadHistory();
    } catch (err) {
      setStatus(`Fehler: ${err.message}`, true);
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = input.value.trim();
    if (!keyword) return;
    runSearch(keyword);
  });

  loadHistory();
})();
