# Domain-Investment-Recherche (.de)

Lokale Web-App zur Recherche von `.de`-Domain-Investment-Kandidaten:
Keyword eingeben → 15–20 Domain-Kandidaten generieren → Verfügbarkeit live per
**DENIC-WHOIS** (`whois.denic.de:43`) prüfen → jeden verfügbaren Kandidaten
transparent regelbasiert bewerten → Ergebnisse als Tabelle mit Direktlink zur
Strato-Domainsuche anzeigen → Recherche lokal in `data/history.json` speichern.

Kein Login, kein Cloud-Deployment – läuft komplett lokal per Node.js.

## Starten

```bash
cd domain-research-tool
npm install
npm start
```

Danach im Browser öffnen: **http://localhost:3000**

Optional lässt sich der Port über die Umgebungsvariable `PORT` ändern:

```bash
PORT=4000 npm start
```

## Funktionsweise

1. **Input**: Ein Thema/Keyword im Eingabefeld (z.B. „KI“, „Robotik“, „Wasserstoff“).
2. **Domain-Generierung** (`lib/domainGenerator.js`): erzeugt 15–20 Kandidaten aus
   dem reinen Begriff, Kombinationen mit gängigen Präfixen (`get-`, `mein-`, `pro-`, …)
   und Suffixen (`-hub`, `-labs`, `-tech`, …) sowie einer kurzen Akronym-/Kurzform-Variante.
3. **Verfügbarkeitsprüfung** (`lib/whois.js`): führt für jeden Kandidaten eine
   WHOIS-Abfrage direkt gegen `whois.denic.de` (Port 43) über das npm-Paket
   [`whois`](https://www.npmjs.com/package/whois) durch. Abfragen laufen
   sequenziell mit Delay, um DENIC-Rate-Limits zu respektieren; bei einer
   unklaren/Rate-Limit-Antwort wird einmalig automatisch erneut versucht.
4. **Scoring** (`lib/scoring.js`): bewertet jeden Kandidaten mit einer
   **transparenten, regelbasierten Heuristik** (Score 1–10) anhand von:
   - Länge (kürzer, insb. <10 Zeichen, wird höher bewertet)
   - keine Bindestriche/Zahlen als Bonus
   - Aussprechbarkeit/Merkbarkeit (Vokal-/Konsonanten-Verteilung)
   - Themenbezug zu im Code gepflegten Wachstumsbranchen (KI, Robotik,
     Energie/Wasserstoff, Biotech, Quantencomputing)
   - generischer Begriff vs. Markenname (generisch = tendenziell höheres
     Wiederverkaufspotenzial)

   **Wichtig:** Der Score ist ausdrücklich **keine Marktprognose und keine
   Zukunftsvorhersage** – nur eine nachvollziehbare Einordnung nach festen
   Regeln. Das steht auch so im UI.
5. **Output**: Tabelle mit Domain, Verfügbarkeit (Ja/Nein/Unbekannt), Score,
   Kurzbegründung und Direktlink zur Strato-Domainsuche
   (`https://www.strato.de/domains/domain-check/?domain=…`).
6. **Sortierung**: verfügbare Domains zuerst, danach absteigend nach Score.
7. **Historie**: jede Recherche wird lokal in `data/history.json` gespeichert
   (max. 50 Einträge) und kann im UI erneut geladen werden, ohne die WHOIS-
   Abfrage zu wiederholen.

## Hinweise zu DENIC-WHOIS

- DENIC limitiert automatisierte Abfragen. Die App fragt Kandidaten daher
  **nacheinander** (nicht parallel) mit einer kurzen Pause zwischen den
  Abfragen ab – eine Recherche mit ~20 Kandidaten kann daher ca. 20–40
  Sekunden dauern.
- Domains mit unklarer/Fehler-Antwort werden als „Unbekannt“ markiert statt
  fälschlich als verfügbar oder vergeben ausgegeben.
- Für den privaten, gelegentlichen Gebrauch gedacht – kein Massen-/
  Dauerbetrieb gegen den DENIC-Whois-Server.

## Projektstruktur

```
domain-research-tool/
  server.js              Express-Server & API-Routen
  lib/
    domainGenerator.js   Domain-Kandidaten-Generierung
    whois.js             DENIC-WHOIS-Abfrage
    scoring.js           Transparente Scoring-Regel-Engine
    history.js           Lokale JSON-Historie
  public/
    index.html            Frontend (ein Eingabefeld, ein Button, eine Tabelle)
    app.js
    style.css
  data/
    history.json          wird automatisch angelegt (nicht versioniert)
```
