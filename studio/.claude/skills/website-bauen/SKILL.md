---
name: website-bauen
description: Baut eine echte, deploybare Kunden-Website (Next.js + Tailwind auf Vercel, alternativ Webflow über den Webflow-MCP) – von Konzept und Texten über Umsetzung, SEO, Rechtliches und Performance bis zum Deployment. Nutzen für Website-Projekte, die live gehen sollen (für schnelle Entwürfe reicht das Website-Segment im Studio).
---

# Website bauen (Produktion)

Referenz für Qualität und Struktur: die SICHTWERK-Website im Repo-Root (`../app`, `../components`, `../lib/constants.ts`).
Fachliche Regeln: Subagent `website` (`.claude/agents/website.md`) und `prompts/grundregeln.md`.

## 1. Briefing & Konzept

- Kundenakte lesen (oder erfragen): Ziel der Website (Anrufe, Reservierungen, Anfragen, Bewerbungen), Zielgruppe, Leistungen, Farben/Logo, vorhandene Texte und Fotos, Domain.
- Ggf. vorhandene Website analysieren (Inhalte, Rankings sichern, Weiterleitungen planen).
- Sitemap und Seitenaufbau festlegen; Texte je Abschnitt schreiben (Subagent `website`, SEO-Daten mit Subagent `seo`).
- Konzept kurz mit dem Nutzer abstimmen, bevor gebaut wird.

## 2. Umsetzung

- **Eigenes Projekt pro Kunde** – neuer Ordner/neues Repository, nicht in dieses Repo hinein.
- Next.js (App Router) + TypeScript + Tailwind; zentrale Inhalte in einer `lib/constants.ts`; Komponenten pro Abschnitt.
- Schriften über `next/font` (lokal ausgeliefert, DSGVO), Bilder über `next/image`, feste Seitenverhältnisse.
- Metadata API: Title/Description, Open Graph, `sitemap.ts`, `robots.ts`, LocalBusiness-JSON-LD mit echten Daten.
- Kontaktformular mit Datenschutzhinweis und serverseitiger Validierung; Versand über einen E-Mail-Dienst (Zugangsdaten nur als Umgebungsvariablen).
- Karten/Videos per Zwei-Klick, Impressum (§ 5 DDG) und Datenschutzerklärung als eigene Seiten (Inhalte vom Kunden bzw. Generator – nicht erfinden).
- Barrierefreiheit: Kontraste, Fokus, Labels, `prefers-reduced-motion`.
- Keine erfundenen Bewertungen, Zahlen oder Kundenstimmen – Platzhalter mit TODO.

**Alternative Webflow:** Wenn der Kunde Webflow nutzt und der Webflow-MCP verbunden ist, Seiten, CMS-Collections und Inhalte darüber anlegen.

## 3. Prüfen

- `npm run build` und `npm run lint` fehlerfrei.
- PageSpeed (mobil) prüfen, LCP-Bild priorisieren, unnötiges JavaScript entfernen.
- Subagent `qualitaet` über Texte und Rechtliches laufen lassen.
- Mobil im Browser durchklicken (Telefon-Link, Formular, Menü).

## 4. Livegang

- Deployment auf Vercel (Projekt importieren), Domain verbinden, HTTPS prüfen.
- Google Search Console + Sitemap einreichen, Bing Webmaster Tools, Website-Link im Google-Profil (mit UTM) aktualisieren.
- Bei Relaunch: 301-Weiterleitungen alt → neu.
- Übergabe-Notiz für den Kunden: was er selbst ändern kann, wer was pflegt.
