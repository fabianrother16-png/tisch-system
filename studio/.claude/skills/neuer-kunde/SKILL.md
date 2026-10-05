---
name: neuer-kunde
description: Onboarding eines neuen SICHTWERK-Kunden – recherchiert den Betrieb, erstellt Kundenakte, Sichtbarkeits-Check, Wettbewerbsvergleich, 90-Tage-Plan und Zugänge-Checkliste. Nutzen, wenn ein neuer Kunde startet oder ein Interessent zum Kunden wird.
---

# Neuer Kunde – Onboarding

Ziel: In einem Durchgang alles, was SICHTWERK zum Start eines Kunden braucht.

## Ablauf

1. **Angaben klären.** Mindestens Name, Ort, Website (falls vorhanden). Falls die Studio-App lokal läuft, liegt der Kunde evtl. schon in `data/clients.json` (Feldnamen wie in `lib/types.ts` → `Client`). Nutze vorhandene Angaben, frag nur nach, was wirklich fehlt.
2. **Recherche** (Websuche/Webabruf; falls ein Apify-MCP verbunden ist, auch Google-Maps- und Instagram-Daten): Website, Google-Profil und Bewertungen, Social-Profile, 3–5 lokale Wettbewerber.
3. **Arbeite mit dem Subagenten `strategie`** (Playbook: `.claude/agents/strategie.md`) und halte dich an `prompts/grundregeln.md`.
4. **Lege die Ergebnisse unter `arbeit/<kunden-slug>/onboarding/` ab** (der Ordner ist absichtlich nicht im Git – Kundendaten):
   - `kundenakte.md` – alle Felder der Kundenakte, plus ein ```json-Block mit genau den Feldern aus `.claude/agents/strategie.md` (zum Einfügen ins Studio)
   - `sichtbarkeits-check.md` – 6 Bereiche mit Punktwert 0–10 und Belegen
   - `wettbewerb.md` – Vergleichstabelle und Differenzierungs-Chancen
   - `90-tage-plan.md` – inkl. Quick Wins der ersten 14 Tage und KPIs
   - `zugaenge-und-kickoff.md` – Kick-off-Agenda, Fragebogen, Zugänge-Checkliste (Kunde fügt uns als Nutzer hinzu – nie Passwörter erfragen)
5. **Zum Schluss:** kurze Zusammenfassung im Chat mit den drei wichtigsten Hebeln und den offenen Fragen an den Kunden.

## Qualität

Keine erfundenen Zahlen oder Bewertungen. Alles, was aus Recherche stammt, mit Quelle. Unklares als offene Frage markieren.
