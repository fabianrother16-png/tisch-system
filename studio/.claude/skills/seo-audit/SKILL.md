---
name: seo-audit
description: Gründliches SEO- und KI-Sichtbarkeits-Audit einer Kunden-Website mit echten Messungen (Seiten abrufen, robots.txt, Sitemap, strukturierte Daten, PageSpeed, Google-Profil-Abgleich) und priorisiertem Maßnahmenplan. Nutzen für „mach ein SEO-Audit für …“.
---

# SEO-Audit

Fachliche Grundlage: Subagent `seo` (`.claude/agents/seo.md`), Regeln in `prompts/grundregeln.md`.

## Messen statt vermuten

1. Startseite und die 3–5 wichtigsten Leistungsseiten abrufen: Title/Description (Zeichen), H1/H2, Wortzahl, interne Links, Bilder ohne Alt, Canonical, `lang`, Kontakt-/Telefon-Links.
2. `robots.txt` (gesperrte Bereiche, KI-Crawler), `sitemap.xml`, `llms.txt`, HTTPS/Weiterleitungen.
3. Strukturierte Daten (JSON-LD) auslesen und gegen die echten Unternehmensdaten prüfen.
4. PageSpeed Insights (mobil) – z. B. per `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&strategy=mobile&category=PERFORMANCE&category=SEO"` (mit `&key=$GOOGLE_API_KEY`, falls gesetzt).
5. Google-Profil und Branchenbücher: Stimmen Name, Adresse, Telefon überein?
6. KI-Sichtbarkeit: typische Fragen („beste … in [Ort]“) recherchieren – wer wird genannt, welche Quellen?

## Bericht

Ablage: `arbeit/<kunden-slug>/seo-audit-<JJJJ-MM-TT>.md` (nicht im Git). Aufbau wie im `seo`-Playbook: Ampel-Übersicht, Befund-Tabelle (Befund · Warum wichtig · Lösung · Aufwand · Priorität), Top-5-Maßnahmen, fertige Meta-Daten-Vorschläge, JSON-LD-Vorschlag, Kundenversion (eine Seite, ohne Fachchinesisch).
