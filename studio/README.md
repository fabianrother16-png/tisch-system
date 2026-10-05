# SICHTWERK Studio

Euer internes Agentur-Werkzeug: **Auftrag eintippen → der passende Spezial-Agent recherchiert und liefert das fertige Ergebnis.** Gebaut auf Claude (Anthropic), mit echten Daten aus Google, TikTok, Instagram und Google Maps, mit direkter Higgsfield-Anbindung für KI-Videos und einer Freigabe-Seite für eure Kunden.

## Was drin ist

### Zehn Spezial-Agenten (Segmente)

| Segment | Liefert | Datenquellen |
|---|---|---|
| **Strategie & Projektleitung** | Sichtbarkeits-Check, Wettbewerbsanalyse, 90-Tage-Plan, Content-Säulen, Kick-off & Zugänge, Kundenakte per Recherche | Websuche, Webseiten, SEO-Check, PageSpeed, Maps, Instagram, TikTok |
| **SEO & KI-Suche** | SEO-Audit, Keyword-Map, Meta-Texte, Blogartikel, Schema (JSON-LD), Branchenbücher, Sichtbarkeit in ChatGPT/Perplexity/AI Overviews | Websuche, SEO-Check, PageSpeed, Maps |
| **Google-Profil & Bewertungen** | Profil-Optimierung, Google-Beiträge, Antworten auf Bewertungen, Bewertungs-Kampagne, NFC-Karten & Aufsteller | Maps, SEO-Check |
| **Video: TikTok & Reels** | Ideen & Hooks, Skripte mit Shotlist, Drehpläne (Drohne/POV), Trend-Analysen, Serienformate, **Higgsfield-Prompts** | TikTok, Instagram |
| **Social Media** | Redaktionsplan (mit CSV-Export), Posts, Karussells, Stories, Bio, Community-Vorlagen, LinkedIn, Gewinnspiele | Instagram, TikTok |
| **Website & Landingpages** | **komplette Seiten als HTML mit Live-Vorschau**, Konzepte, Texte, Conversion-Checks | SEO-Check, PageSpeed |
| **Meta & Google Ads** | Kampagnen-Setups, Anzeigentexte, Creative-Briefings, Recruiting-Kampagnen, Testpläne | Instagram, SEO-Check |
| **Reporting** | Monatsberichte, KPI-Analysen, Live-Momentaufnahmen, Begleittext für den Kunden | Maps, PageSpeed, SEO-Check |
| **Akquise & Angebote** | Lead-Listen (z. B. „Restaurants ohne Website“), Mini-Audits als Türöffner, Angebote, Gesprächsleitfäden | Maps, SEO-Check, PageSpeed, Instagram |
| **Qualität & Recht** | Prüfung vor der Freigabe: Fakten, Ton, Plattform-Vorgaben, UWG, DSGVO, Urheber-/Bildrechte, KI-Kennzeichnung | SEO-Check |

Jeder Agent kennt die **Grundregeln** eurer Agentur (`prompts/grundregeln.md`) – u. a. keine erfundenen Zahlen, Bewertungen oder Preise – und sein eigenes **Playbook** (`.claude/agents/<segment>.md`). Die Playbooks könnt ihr jederzeit selbst anpassen.

### Rund um die Agenten

- **„Was sollen wir bauen?“** – Befehlszeile auf der Übersicht, erkennt das passende Segment automatisch.
- **Kundenakte** – Branche, Ort, Zielgruppe, Tonalität, USPs, Wettbewerber, Dos & Don'ts. Jeder Agent bekommt sie automatisch. **„Mit KI recherchieren“** füllt sie aus Website, Google-Profil und Social Media vor.
- **Monats-Autopilot** – pro Paket (Starter/Wachstum/Premium) werden die monatlichen Lieferungen als Aufgaben angelegt und auf Knopfdruck nacheinander erzeugt.
- **Ergebnisse als Board** – Offen → Entwurf → Interne Prüfung → Beim Kunden → Freigegeben → Veröffentlicht, mit Zuständigkeit (wer von euch beiden), Termin und Kalender.
- **Kundenfreigabe per Link** – geheimer Link per WhatsApp oder E-Mail; der Kunde gibt ohne Login frei oder schreibt Änderungswünsche, die ihr mit einem Klick als Überarbeitungsauftrag übernehmt.
- **Überarbeiten & Versionen** – „kürzer, lockerer …“ eintippen, alte Versionen bleiben wiederherstellbar.
- **Higgsfield-Knopf** – jeder KI-Video-/Bild-Prompt des Video-Agenten lässt sich direkt erzeugen (Kling 3.0, Soul u. a.); das Ergebnis erscheint im Studio.
- **Kostenkontrolle** – jede Lieferung zeigt die KI-Kosten; Übersicht pro Monat und Kunde.
- **Leistungsnachweis für die Buchhaltung** – CSV aller gelieferten Leistungen pro Monat (Einstellungen).
- **Automationen** – „An Automation senden“ schickt Ergebnis + Kundenakte an Make, n8n oder Zapier (z. B. Google Drive, Planungstools, Slack, Buchhaltung).
- **Claude Code** – dieselben Agenten als Subagenten plus Workflows für große Aufgaben (siehe unten).

## Schnellstart (lokal)

Voraussetzung: [Node.js 20+](https://nodejs.org).

```bash
cd studio
cp .env.example .env      # und ANTHROPIC_API_KEY eintragen
npm install
npm run dev
```

Dann <http://localhost:3100> öffnen und den Schritten unter „Erste Schritte“ folgen: Einstellungen (Team, Agentur-Infos, Preisliste) ausfüllen, ersten Kunden anlegen, loslegen.

Den API-Schlüssel gibt es unter [platform.claude.com](https://platform.claude.com) → API Keys. Tipp: dort gleich ein monatliches Ausgabenlimit setzen.

## Online stellen (für euch beide, von überall)

1. Bei [Vercel](https://vercel.com) ein **neues Projekt** aus diesem Repository anlegen und als **Root Directory `studio`** wählen (die Website im Repo-Root bleibt ein eigenes Projekt).
2. Unter **Storage → Upstash for Redis** eine Datenbank verbinden – Vercel setzt die Zugangsdaten automatisch. Ohne Datenbank gehen Daten auf Vercel verloren (das Studio warnt dann).
3. Umgebungsvariablen setzen: mindestens `ANTHROPIC_API_KEY` und **`STUDIO_PASSWORD`** (langes Passwort – ohne ist das Studio öffentlich!). Optional die weiteren Schlüssel unten.
4. Deployen. Freigabe-Links für Kunden funktionieren ohne Passwort, alles andere ist geschützt.

Hinweis: Lange Recherchen dürfen bis zu 300 Sekunden laufen (`maxDuration` in `app/api/run/route.ts`) – das passt zum Vercel-Hobby-Tarif. Mit einem höheren Tarif könnt ihr den Wert anheben.

## Verbindungen (Umgebungsvariablen)

| Variable | Wofür | Pflicht |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude – alle Agenten, Websuche, Webseiten lesen | ja |
| `STUDIO_PASSWORD` | Login-Schutz | sobald online |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | gemeinsamer Speicher (auf Vercel) – alternativ `KV_REST_API_URL`/`KV_REST_API_TOKEN` | online: ja |
| `APIFY_TOKEN` | Live-Daten aus TikTok, Instagram, Google Maps ([Apify](https://console.apify.com), Abrechnung pro Ergebnis) | nein |
| `GOOGLE_API_KEY` | PageSpeed Insights mit vollem Kontingent | nein |
| `HIGGSFIELD_API_KEY_ID`, `HIGGSFIELD_API_KEY_SECRET` | KI-Videos/-Bilder direkt erzeugen ([console.higgsfield.ai](https://console.higgsfield.ai)) | nein |

Ohne Apify arbeiten Video-, Social- und Akquise-Agent mit der Websuche und sagen offen, wo Live-Daten fehlen. LinkedIn wird bewusst nicht gescrapt (Nutzungsbedingungen) – LinkedIn-Inhalte entstehen aus Kundenakte und Websuche.

## Mit Claude Code arbeiten

Startet Claude Code im Ordner `studio/`. Dann stehen bereit:

- **Subagenten** (`.claude/agents/`): `strategie`, `seo`, `google-profil`, `video`, `social`, `website`, `ads`, `reporting`, `akquise`, `qualitaet` – dieselben Playbooks wie im Studio.
- **Workflows** (`.claude/skills/`):
  - `neuer-kunde` – komplettes Onboarding inkl. Kundenakte, Sichtbarkeits-Check und 90-Tage-Plan
  - `monats-content` – das ganze Monatspaket eines Kunden, Agenten parallel, mit Qualitätsprüfung
  - `website-bauen` – echte Kunden-Website (Next.js/Vercel oder Webflow) bis zum Livegang
  - `seo-audit` – Audit mit echten Messungen
  - `angebot` – Mini-Audit + Angebot mit drei Optionen
- **MCP** (`.mcp.json`): Apify für Live-Daten (nutzt `APIFY_TOKEN`). Webflow lässt sich über die Claude-Connectoren verbinden.

Ergebnisse aus Claude Code landen in `studio/arbeit/` – der Ordner ist (wie `data/`) nicht im Git, weil dort Kundendaten liegen.

## Anpassen

| Was | Wo |
|---|---|
| Fachwissen eines Agenten | `.claude/agents/<segment>.md` |
| Regeln für alle Agenten | `prompts/grundregeln.md` |
| Schnellstart-Knöpfe, Werkzeuge je Segment | `lib/segments.ts` |
| Pakete und Monats-Autopilot | `lib/pakete.ts` |
| KI-Modell | Studio → Einstellungen (Standard: Claude Opus 5.5) |
| Agentur-Infos, Preisliste, Team, Webhook | Studio → Einstellungen |

## Was eine Lieferung kostet

Jeder Lauf wird exakt abgerechnet und im Studio angezeigt (pro Ergebnis, pro Kunde, pro Monat). Grob: Kurze Texte ohne Recherche kosten wenige Cent; Läufe mit viel Recherche (Audits, Wettbewerbsanalysen, komplette Websites) deutlich mehr, weil Suchergebnisse und Webseiten mitgelesen werden – schaut nach den ersten Läufen in die Kostenanzeige. Websuchen kosten zusätzlich 1 Cent pro Suche, Apify und Higgsfield rechnen separat ab. Wer sparen will, stellt in den Einstellungen auf Claude Sonnet 5.5 um.

## Woran ihr denken solltet (und vielleicht noch nicht habt)

1. **Auftragsverarbeitung (DSGVO).** Ihr verarbeitet Daten eurer Kunden (Bewertungen, Kontakte, Zugänge). Schließt mit jedem Kunden einen AV-Vertrag und prüft die Verträge eurer Dienstleister (Anthropic, Vercel, Upstash, Apify). Gebt keine sensiblen Daten (Gesundheit, Mitarbeiterdaten) in Aufträge ein.
2. **Zugänge statt Passwörter.** Google-Profil, Meta Business Suite, TikTok, Search Console: lasst euch als Nutzer/Partner hinzufügen. Für den Rest einen Passwort-Manager mit geteilten Tresoren.
3. **Verträge sauber aufsetzen.** Nutzungsrechte an Fotos und Videos (wer darf was, wie lange), Mitwirkungspflichten (z. B. Freigabe innerhalb von 5 Werktagen), Laufzeit und Kündigung – und ein Satz dazu, dass ihr KI-gestützt arbeitet.
4. **Drohne.** EU-Kompetenznachweis, Registrierung beim LBA, Haftpflichtversicherung, Flugzonen auf dipul.de prüfen – gehört in jeden Drehplan.
5. **Menschen im Bild.** Schriftliche Einwilligung von Mitarbeitern und Gästen, die erkennbar sind. Eine Vorlage spart euch bei jedem Dreh Zeit.
6. **Musik.** Unternehmenskonten nur mit kommerziell freigegebener Musik – sonst drohen Abmahnungen oder stummgeschaltete Videos.
7. **KI-Inhalte kennzeichnen.** Realistische KI-Videos/-Bilder (z. B. aus Higgsfield) auf den Plattformen als KI-generiert markieren und nie echte Produkte oder Räume „schöner“ zeigen, als sie sind.
8. **Bewertungen.** Kein „nur Zufriedene fragen“ und keine Gegenleistungen für Bewertungen – das gilt auch für die Texte auf euren NFC-Karten.
9. **Akquise.** Kalt-E-Mails sind auch an Firmen unzulässig. Euer Vorteil ist der persönliche Besuch vor Ort – der Akquise-Agent schreibt euch Besuchsleitfaden, Brief und Mini-Audit.
10. **Neue Produkte.** Recruiting-Content und -Kampagnen (Fachkräfte/Azubis) und „Sichtbarkeit in ChatGPT & Co.“ sind für den Mittelstand gerade sehr gefragt – beide Agenten können das.
11. **Reporting verhindert Kündigungen.** Kunden, die jeden Monat sehen, was ihr geliefert habt und was es gebracht hat, bleiben. Monatsbericht und Leistungsnachweis sind deshalb im Autopilot.
12. **Euch selbst vermarkten.** Nutzt die Agenten auch für SICHTWERK: eigene Reels, eigenes Google-Profil, Fallstudien (mit Erlaubnis der Kunden).
13. **Kosten deckeln.** Ausgabenlimits bei Anthropic, Apify und Higgsfield setzen.
14. **Backups.** Lokal den Ordner `data/` sichern; bei Upstash regelmäßig exportieren.
15. **Eigene Website.** Laut Website-README stehen dort noch Platzhalter (Impressum, Datenschutz, Kontaktformular-Versand, Fotos) – vor dem Livegang ersetzen.

## Technik

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Anthropic TypeScript SDK (Streaming, adaptives Denken, Websuche & Webabruf, eigene Werkzeuge, serverseitige Fallbacks). Speicher: JSON-Dateien lokal oder Upstash Redis. Details für Entwickler: `CLAUDE.md`.
