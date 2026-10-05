# Repository-Überblick

Dieses Repository enthält zwei getrennte Next.js-Apps:

- **Repo-Root** – die öffentliche SICHTWERK-Website (siehe `README.md`).
- **`studio/`** – SICHTWERK Studio, das interne Agentur-Werkzeug mit Spezial-Agenten (siehe `studio/README.md` und `studio/CLAUDE.md`).

Die beiden Apps haben eigene `package.json`, Lint- und TypeScript-Konfigurationen; `studio/` ist in der Root-`tsconfig.json` und `eslint.config.mjs` ausgeschlossen.

## Agenturarbeit (Content, SEO, Videos, Websites, Angebote …)

Für Kundenarbeit die Agenten und Workflows aus `studio/` verwenden:

- Regeln für jede Lieferung: `studio/prompts/grundregeln.md`
- Spezial-Agenten (Playbooks): `studio/.claude/agents/` – strategie, seo, google-profil, video, social, website, ads, reporting, akquise, qualitaet
- Workflows: `studio/.claude/skills/` – neuer-kunde, monats-content, website-bauen, seo-audit, angebot

Am bequemsten startet man Claude Code direkt in `studio/`, dann sind Agenten und Skills automatisch geladen. Kundendaten gehören nach `studio/arbeit/` bzw. `studio/data/` (beide nicht im Git) – niemals committen.
