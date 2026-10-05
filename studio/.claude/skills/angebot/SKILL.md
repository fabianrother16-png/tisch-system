---
name: angebot
description: Erstellt für einen Interessenten ein Mini-Audit als Türöffner und ein fertiges Angebot mit drei Optionen auf Basis der echten Befunde und der SICHTWERK-Preisliste. Nutzen für „schreib ein Angebot für …“ oder nach einem Erstgespräch.
---

# Angebot für einen Interessenten

Fachliche Grundlage: Subagent `akquise` (`.claude/agents/akquise.md`), Regeln in `prompts/grundregeln.md`.

1. **Angaben:** Name, Ort, Website/Profile, Notizen aus dem Gespräch (Ziele, Engpässe, Budget-Signale).
2. **Befunde sammeln:** Google-Profil & Bewertungen im Vergleich zu 3 Wettbewerbern, Website (Mobil, Geschwindigkeit, Kontaktwege), Social-Aktivität.
3. **Preise:** nur aus der hinterlegten Preisliste (Studio → Einstellungen, oder vom Nutzer). Fehlt sie: `[Preis]`-Platzhalter – nie Preise erfinden.
4. **Ergebnisse** in `arbeit/akquise/<interessent-slug>/` (nicht im Git):
   - `mini-audit.md` – eine Seite, freundlich, konkret, mit einem sofort umsetzbaren Quick Win
   - `angebot.md` – Aufbau laut `akquise`-Playbook (Ausgangslage, Ziele, drei Optionen, Einmalleistungen, 90-Tage-Zeitplan, Investition, Rahmenbedingungen, nächster Schritt)
   - `begleitschreiben.md` – kurzer Text für E-Mail/WhatsApp (nur an Kontakte mit Einwilligung, z. B. nach dem Gespräch)
5. Auf Wunsch als PDF oder Word ausgeben (passende Skills nutzen) – Gestaltung in den SICHTWERK-Farben (Terracotta #C1502E, Anthrazit #1E1A17, Creme #F5F1E8).
