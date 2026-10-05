# SICHTWERK Studio – Hinweise für Claude Code

Internes Agentur-Werkzeug von SICHTWERK (Marketing-Agentur aus Gütersloh). Zwei Nutzungsarten teilen sich dasselbe Fachwissen:

1. **Studio-Web-App** (Next.js) – Dashboard, Kunden, Spezial-Agenten, Ergebnisse, Freigaben.
2. **Claude Code** – dieselben Agenten als Subagenten plus Workflow-Skills für größere Aufgaben.

## Agenturarbeit in Claude Code

- Lies zuerst `prompts/grundregeln.md` – sie gelten für jede Lieferung (u. a.: keine erfundenen Zahlen/Bewertungen, Recht DE/EU, Antwortaufbau).
- Spezial-Agenten: `.claude/agents/<segment>.md` (strategie, seo, google-profil, video, social, website, ads, reporting, akquise, qualitaet). Delegiere an den passenden Subagenten; unabhängige Teilaufgaben parallel.
- Workflows: `.claude/skills/` – `neuer-kunde`, `monats-content`, `website-bauen`, `seo-audit`, `angebot`.
- Kundenakte: Läuft die App lokal, liegen Kunden in `data/clients.json` (Struktur: `Client` in `lib/types.ts`). Sonst den Nutzer fragen („Kundenakte kopieren“ im Studio).
- Lieferungen nach `arbeit/<kunden-slug>/…` schreiben. `arbeit/` und `data/` sind absichtlich in `.gitignore` – **Kundendaten nie committen**.
- Optionaler MCP-Server in `.mcp.json`: Apify (TikTok-, Instagram-, Google-Maps-Daten), nutzt die Umgebungsvariable `APIFY_TOKEN`.

## Entwicklung der App

```bash
npm install
npm run dev        # http://localhost:3100
npm run lint
npm run typecheck
npm run build
```

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind 3 mit den Markenfarben `terracotta`, `anthracite`, `cream`.
- Next 16: Middleware heißt `proxy.ts` (Passwortschutz); `params`/`searchParams` sind Promises.
- UI-Texte auf Deutsch. Komponenten-Klassen (`btn-primary`, `card`, `input`, `label`, `chip`) stehen in `app/globals.css`.
- Server-Module importieren `server-only`. Client-sichere Module: `lib/segments.ts`, `lib/labels.ts`, `lib/models.ts`, `lib/pakete.ts`, `lib/kundenakte.ts`, `lib/types.ts`, `lib/browser.ts`.

### Wichtige Dateien

| Datei | Zweck |
|---|---|
| `lib/runtime.ts` | Agenten-Schleife mit der Claude-API (Streaming, Websuche/Webabruf, eigene Werkzeuge, `pause_turn`, Fallbacks) |
| `lib/prompt.ts` | System-Prompt (Grundregeln + Agentur + Playbook) und Nutzernachricht (Datum, Kundenakte, Auftrag) |
| `lib/tools/` | Studio-Werkzeuge: SEO-Check, PageSpeed, Apify (TikTok/Instagram/Maps), Higgsfield; SSRF-Schutz in `net.ts` |
| `app/api/run/route.ts` | Startet Läufe, streamt NDJSON, speichert Ergebnisse und Kosten |
| `lib/segments.ts` | Segmente, Schnellstarts, Werkzeuge je Segment, Routing der Befehlszeile |
| `lib/pakete.ts` | Pakete und Monats-Autopilot-Aufgaben |
| `lib/store.ts` / `lib/db.ts` | Speicher (JSON-Dateien lokal oder Upstash Redis) und Datenzugriff |
| `.claude/agents/*.md` | Playbooks – von App **und** Claude Code genutzt. Frontmatter (`name`, `description`) Claude-Code-kompatibel halten; der Text danach ist das Fachwissen. |

### Konventionen für Änderungen an Playbooks

- Klare Ziele und Fachwissen statt Großbuchstaben-Befehlen; Begründungen mitliefern.
- Nichts behaupten, was nicht belegt ist (Zahlen, Gesetze, Plattformregeln) – im Zweifel vorsichtig formulieren.
- Ausgabeblöcke ```` ```html ````, ```` ```higgsfield ````, ```` ```csv ```` werden von der App erkannt (`components/Markdown.tsx`).
