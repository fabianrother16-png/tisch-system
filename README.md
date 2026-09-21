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
2. Kein zusätzliches Environment-Setup nötig — die Seite braucht aktuell
   keine Umgebungsvariablen.
3. Framework-Preset „Next.js" wird automatisch erkannt.
4. `SITE.url` in `lib/constants.ts` auf die finale Domain anpassen, damit
   Sitemap, Robots, Canonical-URLs und Open-Graph-Daten korrekt sind.

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
