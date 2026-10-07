# SICHTWERK — Website

One-Page-Business-Website für SICHTWERK, eine Marketing-Agentur aus Gütersloh
("Digitale Sichtbarkeit für den Mittelstand"). Gebaut mit Next.js (App Router),
TypeScript, Tailwind CSS und Framer Motion.

## Tech-Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript**
- **Tailwind CSS** für Styling und Design-Tokens (Farben, Fonts, Animationen)
- **Framer Motion** für Scroll-Reveal- und Microinteraction-Animationen
- **lucide-react** für Icons
- Eigene JSON-LD-, Sitemap-, Robots- und OG-Image-Generierung über die
  Next.js Metadata API

## Setup

```bash
npm install
npm run dev
```

Die Seite läuft danach unter `http://localhost:3000`.

### Weitere Befehle

```bash
npm run build   # Produktions-Build
npm run start   # Produktions-Server (nach dem Build)
npm run lint    # ESLint (next/core-web-vitals + next/typescript)
```

## Projektstruktur

```
app/
  layout.tsx          Root-Layout, Fonts, Metadata, JSON-LD (LocalBusiness)
  page.tsx             Zusammensetzung aller Sections
  globals.css          Design-Tokens, Basis-Styles, Reduced-Motion-Regeln
  sitemap.ts           /sitemap.xml
  robots.ts            /robots.txt
  icon.tsx             Favicon (generiert, Logo-Icon)
  opengraph-image.tsx  OG-Bild (generiert)
  api/contact/route.ts API-Route für das Kontaktformular
components/
  Hero.tsx             Kinetische Headline, Scroll-Parallax, Logo-Watermark
  Marquee.tsx          Endless-Loop-Ticker mit den Kernleistungen
  Services.tsx, WhyUs.tsx, Showcase.tsx, About.tsx,
  Process.tsx, Contact.tsx, Header.tsx, Footer.tsx, Logo.tsx
  ui/                  Wiederverwendbare Primitives:
    Button.tsx           Varianten primary/secondary/ghost/light
    MagneticButton.tsx    Magnetischer Hover-Effekt (Framer Motion)
    Reveal.tsx            Scroll-Reveal mit Varianten up/scale/left/right
    Container.tsx, SectionHeading.tsx
lib/
  constants.ts          Zentrale Inhalte (Leistungen inkl. Bento-Layout,
                          USPs, Showcase-Items, Marquee-Begriffe, Nav, …)
```

## Vor dem Live-Gang noch zu erledigen

Die Seite ist deploy-fertig, enthält aber bewusste Platzhalter, die vor dem
echten Launch ersetzt werden sollten:

1. **Hero-Video:** Aktuell ein animiertes Balken-Motiv als Platzhalter für
   einen Video-Loop-Hintergrund (Drohnenaufnahme). Hinweis zum Einbau steht
   als Kommentar in `components/Hero.tsx`.
2. **Showcase-Galerie:** `components/Showcase.tsx` zeigt editorielle
   Platzhalter-Grafiken (kein Fake-Foto) für Drohnen-/POV-Aufnahmen. Jeder
   Eintrag in `SHOWCASE_ITEMS` (`lib/constants.ts`) trägt ein `query`-Feld
   mit einem empfohlenen Unsplash-/Pexels-Suchbegriff für lizenzfreies
   Zwischenmaterial. Sobald echtes Material vorliegt: die mit TODO markierte
   `PlaceholderArt`-Fläche in `Showcase.tsx` durch `<Image fill
   className="object-cover" .../>` (next/image) ersetzen.
3. **Kontaktformular-Backend:** `app/api/contact/route.ts` validiert und
   loggt Anfragen serverseitig, verschickt aber noch keine E-Mail. Für den
   Produktivbetrieb an einen Dienst wie Resend, Postmark oder ein CRM
   anbinden (Zugangsdaten dafür sind bewusst nicht im Repo).
4. **Kontaktdaten & Rechtliches:** Platzhalter-E-Mail/Telefonnummer in
   `lib/constants.ts` sowie Impressum-/Datenschutz-Links im Footer durch
   echte Seiten ersetzen.
5. **Social-Links:** Instagram/Facebook/LinkedIn-Links in `components/Footer.tsx`
   sind aktuell `#`.
6. **Gründerfotos:** Die Monogramm-Platzhalter in `components/About.tsx`
   gegen echte Porträts austauschen.

## Deployment (Vercel)

1. Repository zu Vercel importieren.
2. Die Website selbst braucht keine Umgebungsvariablen. Für das Studio die
   Schlüssel aus `.env.example` eintragen (mindestens `STUDIO_PASSWORD`).
3. Framework-Preset „Next.js" wird automatisch erkannt.
4. `SITE.url` in `lib/constants.ts` auf die finale Domain anpassen, damit
   Sitemap, Robots, Canonical-URLs und Open-Graph-Daten korrekt sind.

## SICHTWERK Studio (`/studio`)

Internes Produktionswerkzeug für virale TikToks und Reels, mit mehreren Kunden.
Läuft in derselben Next.js-App unter `/studio` und wird nicht indexiert.

### Ablauf

1. **Kunde anlegen:** Branche/Beruf, Zielgruppe („alle“ ist erlaubt), Ziel,
   Tonalität, CTA und Brand-Kit (Farben, Logo-Wasserzeichen, Untertitel-Stil).
2. **Recherche:** Die KI erstellt eine Suchstrategie. Danach durchsucht das
   Studio TikTok (Suche) und Instagram (Hashtag-Reels) über Apify, rankt die
   Accounts nach Reichweite, Spitzenwerten, Engagement und Konstanz und lässt
   die KI die echten Konkurrenten auswählen.
3. **Hauptkonkurrent:** Profil-Videos inklusive Transkripten laden und
   analysieren: warum so viele Aufrufe, was richtig, was falsch, Hook-Muster,
   Top- und Flop-Videos. Daraus entsteht der **Skript-Entwurf**.
4. **Bis zu 10 weitere Konkurrenten** werden einzeln analysiert, danach die
   Muster über alle hinweg (Erfolgsmuster, Fehler, Content-Lücken, Benchmarks).
5. **Trends:** Die Plattform-Daten werden ausgewertet (Hashtags, Sounds,
   Länge vs. Aufrufe, Wochentage, virale Videos der letzten Wochen). Dazu kommt
   eine Web-Recherche über die Claude-Websuche mit Quellenangaben.
6. **Finales Skript:** 3 Hooks, Szenen mit Sekunden, Sprechtext,
   Text-Overlays, KI-Prompts je Szene, Caption, Hashtags für TikTok und
   Instagram, Sound, Posting-Zeit. Dazu Teleprompter, Markdown- und Report-Export.
7. **Video:**
   - **KI-Video:** Voiceover (ElevenLabs) gibt das Timing vor. Jede Szene wird
     per fal.ai (Kling 3 oder Veo 3.1) generiert oder durch einen eigenen Clip
     ersetzt. Danach Schnitt mit Hook-Box, Untertiteln und Overlays.
   - **Eigene Clips:** Hochladen, automatisch transkribieren, die KI schneidet
     (stärkster Moment als Hook nach vorn, Pausen raus, Zooms, Texte).
   - **Clip-Finder:** Aus einer langen Aufnahme mehrere Shorts machen und auf
     Wunsch alle am Stück rendern und bewerten.
8. **Viral-Check:** Die KI bewertet das fertige Video (Standbilder + Text):
   Score 0–100, sieben Kategorien, priorisierte Verbesserungen, Caption,
   Hashtags getrennt für TikTok und Instagram. „Verbesserungen umsetzen & neu
   schneiden“ startet die nächste Version.
9. **Content-Plan & Autopilot:** 30-Tage-Plan mit Kalender, alle Skripte auf
   einmal schreiben, und der Autopilot produziert für die ausgewählten Ideen
   komplette KI-Videos (Stimme → Szenen → Schnitt → Rating). Dazu gibt es das
   **Hook-Lab** mit 10 bewerteten Hook-Varianten pro Thema.

### Technik

- **Daten bleiben im Browser** (IndexedDB): Kunden, Projekte und Videodateien.
  Unter Einstellungen gibt es Export/Import als Backup oder zum Gerätewechsel.
  Videos werden **im Browser gerendert** (WebCodecs via Mediabunny):
  1080×1920, 30 fps, MP4 (H.264/AAC). Browser ohne H.264-Encoder bekommen WebM.
  Empfohlen sind aktuelle Versionen von Chrome, Edge oder Safari.
- **Lange Jobs** (Scraper, KI-Clips) laufen asynchron mit Polling. So gibt es
  keine Serverless-Timeouts. Jeder Recherche-Schritt wird gespeichert und lässt
  sich nach einem Fehler oder Neuladen fortsetzen.
- **Claude** liefert strukturierte Ausgaben (Zod-Schemas in
  `lib/studio/schemas.ts`) mit adaptivem Denken und serverseitigem
  Refusal-Fallback. Die Prompts liegen in `lib/studio/server/tasks.ts`.
- **Apify-Actors:** `clockworks~tiktok-scraper`,
  `apify~instagram-hashtag-scraper`, `apify~instagram-reel-scraper`,
  `apify~instagram-scraper` (per `APIFY_*_ACTOR` überschreibbar). Läufe sind
  mit `maxItems` und `APIFY_MAX_CHARGE_USD` gedeckelt.

### Einrichtung

`.env.example` nach `.env.local` kopieren (bzw. in Vercel eintragen):

| Variable | Wofür |
| --- | --- |
| `STUDIO_PASSWORD` | Zugangsschutz, in Produktion Pflicht |
| `ANTHROPIC_API_KEY` | Analysen, Skripte, Websuche, Schnitt, Rating |
| `APIFY_API_TOKEN` | TikTok-/Instagram-Daten |
| `ELEVENLABS_API_KEY` | Sprecherstimme und automatische Untertitel |
| `FAL_KEY` | KI-Videoszenen |

Ohne einzelne Schlüssel bleibt der Rest nutzbar. Die Einstellungsseite zeigt,
was fehlt. Vercel-Hinweis: Die API-Routen nutzen `maxDuration = 300` s
(Fluid Compute).

## Design

- **Farben:** Terracotta `#C1502E`, Anthrazit `#1E1A17`, Creme `#F5F1E8`
  (siehe `tailwind.config.ts`)
- **Typografie:** Fraunces (Headlines, Serif) & Work Sans (Fließtext,
  Grotesk), geladen über `next/font/google`
- **Icon-Leitmotiv:** zwei sich diagonal überschneidende, leicht gedrehte
  Balken (`components/Logo.tsx`, `app/icon.tsx`, `app/opengraph-image.tsx`)
- **Kinetische Typografie:** Hero-Headline fliegt wortweise gestaffelt ein
  und reagiert mit sanftem Parallax auf Scrollen (`components/Hero.tsx`)
- **Bento-Grid:** Leistungen-Bereich mit kuratierten, unterschiedlich großen
  Kacheln statt gleichförmigem Raster (`BENTO_LAYOUT` in
  `components/Services.tsx`)
- **Microinteractions:** magnetische Buttons (`components/ui/
  MagneticButton.tsx`), varianten-basierte Scroll-Reveals (`components/ui/
  Reveal.tsx`), Marquee-Ticker (`components/Marquee.tsx`)
- **Barrierefreiheit:** semantisches HTML, Skip-Link, sichtbare Fokuszustände,
  `prefers-reduced-motion`-Unterstützung (inkl. Marquee/Magnetic-Buttons),
  gegen WCAG AA geprüfte Kontraste
