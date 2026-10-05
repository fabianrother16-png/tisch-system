---
name: monats-content
description: Erstellt das komplette Monatspaket für einen Kunden (Google-Beiträge, Redaktionsplan, Reel-/TikTok-Skripte, Blogartikel, ggf. Ads) mit den Spezial-Agenten parallel und lässt alles von der Qualitätsprüfung gegenlesen. Nutzen für „mach den Content für Kunde X im Monat Y“.
---

# Monats-Content für einen Kunden

## Vorbereitung

1. Kunde und Monat klären. Kundenakte aus `data/clients.json` (falls die Studio-App lokal läuft) oder vom Nutzer (im Studio: „Kundenakte kopieren“).
2. Gebuchtes Paket bestimmen (`lib/pakete.ts` zeigt, was pro Paket monatlich geliefert wird).
3. Saison, Feiertage (NRW) und lokale Anlässe des Monats kurz recherchieren – das ist Input für alle Agenten.

## Parallel delegieren (Subagenten)

Starte die passenden Subagenten **parallel**, jeweils mit Kundenakte, Monat und Saison-Notizen:

- `google-profil` → 4 Google-Beiträge
- `social` → Redaktionsplan (3 Posts/Woche) inkl. CSV
- `video` → 8 Reel-/TikTok-Skripte mit Shotlist (2 × 4), plus Higgsfield-Prompts, wo KI-B-Roll sinnvoll ist
- `seo` → 1 Blogartikel zum wichtigsten Keyword-Thema
- `ads` → nur im Premium-Paket: Creatives und Anzeigentexte

Danach den Subagenten `qualitaet` über alle Ergebnisse laufen lassen und gefundene Probleme direkt korrigieren.

## Ablage

`arbeit/<kunden-slug>/<JJJJ-MM>/` (nicht im Git):
`google-beitraege.md`, `redaktionsplan.md`, `redaktionsplan.csv`, `video-skripte.md`, `blogartikel.md`, ggf. `ads.md`, `pruefbericht.md`.

Abschluss im Chat: Übersicht der Dateien, Drehliste für den Drehtag (alle Szenen, die vor Ort gefilmt werden müssen, gruppiert nach Ort) und was der Kunde freigeben bzw. liefern muss.
