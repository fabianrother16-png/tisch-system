# Fliesen Khalil – Website

Produktionsreife Website für den Fliesenleger-Betrieb **Fliesen Khalil** in
Dortmund. Gebaut mit **Next.js (App Router)**, **TypeScript** und
**Tailwind CSS**.

## Inhalt

- [Projektstruktur](#projektstruktur)
- [Was Sie selbst ändern können](#was-sie-selbst-ändern-können)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Kontaktformular an einen E-Mail-Dienst anbinden](#kontaktformular-an-einen-e-mail-dienst-anbinden)
- [Chat-Widget erweitern](#chat-widget-erweitern)
- [Eigene Fotos einpflegen](#eigene-fotos-einpflegen)
- [Rechtliches (Impressum & Datenschutz)](#rechtliches-impressum--datenschutz)
- [Deployment auf Vercel](#deployment-auf-vercel)

---

## Projektstruktur

```
app/
  layout.tsx          Root-Layout, Fonts, Meta-Tags, JSON-LD (strukturierte Daten)
  page.tsx             Startseite (setzt alle Sektionen zusammen)
  globals.css          Globale Styles & Tailwind-Utility-Klassen
  icon.tsx              Dynamisch generiertes Favicon
  opengraph-image.tsx  Dynamisch generiertes Social-Share-Bild
  sitemap.ts / robots.ts
  impressum/page.tsx
  datenschutz/page.tsx
  api/
    contact/route.ts   API-Route für das Kontaktformular
    chat/route.ts       API-Route für das Chat-Widget

components/
  Header.tsx           Navigation inkl. mobilem Menü
  Hero.tsx              Hero-Bereich mit Call-to-Action
  Services.tsx          6 Leistungen als Karten
  Gallery.tsx           Referenzgalerie mit Filter
  About.tsx              Über-uns-Bereich mit den 4 Werten & Partnern
  Contact.tsx / ContactForm.tsx
  ChatWidget.tsx         Chat-Baustein unten rechts
  Footer.tsx

lib/
  content.ts             Zentrale Inhalte: Firmendaten, Leistungen, Werte,
                          Partner, Referenzgalerie
  validation.ts           Validierungsregeln für das Kontaktformular
  chatResponses.ts        Regelbasierte Chat-Antworten

public/images/gallery/    Ablageort für echte Referenzfotos
```

## Was Sie selbst ändern können

**Fast alle Texte, Kontaktdaten und Inhalte liegen zentral in
`lib/content.ts`.** Dort lassen sich anpassen:

- Firmendaten (Adresse, Telefon, E-Mail, Öffnungszeiten)
- Partner (Schlüter Systems, Sakret, Fliesenrabatte)
- Die 4 Werte im Über-uns-Bereich
- Die 6 Leistungen (Titel, Beschreibung, Icon)
- Die Referenzgalerie (Titel, Ort, Kategorie, Bildpfad)

**Farben** lassen sich in `tailwind.config.ts` unter `theme.extend.colors`
zentral austauschen (Terrakotta- und Blau-Töne, Sand-Hintergrund).

**Schriften** werden in `app/layout.tsx` über `next/font/google` geladen
(aktuell „Fraunces“ für Headlines, „Inter“ für Fließtext).

## Lokale Entwicklung

Voraussetzung: Node.js 18.18+ (empfohlen: aktuelle LTS-Version).

```bash
npm install
npm run dev
```

Die Seite ist danach unter `http://localhost:3000` erreichbar.

Weitere Skripte:

```bash
npm run build   # Produktions-Build erstellen
npm run start   # Produktions-Build lokal starten
npm run lint    # Code-Qualität prüfen (ESLint)
```

## Kontaktformular an einen E-Mail-Dienst anbinden

Das Formular validiert Eingaben clientseitig (`lib/validation.ts`) und
sendet sie per `POST` an `app/api/contact/route.ts`. Aktuell wird die
Anfrage dort nur geloggt (`console.log`) – das ist der Platzhalter, an dem
Sie einen echten Versand ergänzen:

```ts
// app/api/contact/route.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "Fliesen Khalil Website <noreply@fliesen-khalil.de>",
  to: company.email,
  subject: `Neue Anfrage von ${data.name}`,
  text: `Name: ${data.name}\nPLZ/Ort: ${data.zipCity}\nE-Mail: ${data.email}\nTelefon: ${data.phone}\n\n${data.message}`,
});
```

Alternativen: Nodemailer + eigenes SMTP-Postfach, SendGrid, Mailgun,
Postmark. API-Keys als Umgebungsvariablen in den Vercel-Projekteinstellungen
hinterlegen (siehe unten) und über `process.env` auslesen.

## Chat-Widget erweitern

Das Chat-Widget (`components/ChatWidget.tsx`) sendet Nachrichten an
`app/api/chat/route.ts`. Dort antwortet aktuell eine einfache, regelbasierte
Logik (`lib/chatResponses.ts`) auf Stichworte wie „Preis“, „Referenz“,
„Termin“. Für eine echte KI-Anbindung (z. B. über die Anthropic API) muss
nur die API-Route angepasst werden – die Komponente selbst bleibt
unverändert, solange die Route weiterhin `{ reply: string }` zurückgibt:

```ts
// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await anthropic.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 400,
  system: "Du bist der Chat-Assistent von Fliesen Khalil ...",
  messages: [{ role: "user", content: message }],
});
```

## Eigene Fotos einpflegen

Die Referenzgalerie ist als Platzhalterstruktur angelegt. Fotos ablegen
unter `public/images/gallery/` und in `lib/content.ts` beim jeweiligen
Eintrag den Pfad eintragen:

```ts
{
  id: "ref-01",
  category: "Bäder",
  title: "Barrierefreies Bad",
  location: "Dortmund-Innenstadt",
  image: "/images/gallery/bad-dortmund-01.jpg", // vorher: null
  alt: "Barrierefreies Badezimmer mit bodengleicher Dusche in Dortmund",
},
```

Solange `image: null` gesetzt ist, zeigt die Galerie automatisch einen
gestalteten „Foto folgt“-Platzhalter.

## Rechtliches (Impressum & Datenschutz)

`app/impressum/page.tsx` und `app/datenschutz/page.tsx` enthalten
**Platzhalter-Texte** (Rechtsform, USt-IdNr., verantwortliche Person,
Hosting-Anbieter etc.). Bitte vor dem Livegang ausfüllen und rechtlich
prüfen lassen.

## Deployment auf Vercel

1. **Repository vorbereiten**: Projekt in ein Git-Repository pushen (z. B.
   GitHub).
2. **Bei Vercel importieren**: Auf [vercel.com](https://vercel.com) mit dem
   Git-Account anmelden → „Add New… → Project“ → das Repository auswählen.
3. **Framework-Erkennung**: Vercel erkennt Next.js automatisch. Build- und
   Output-Einstellungen müssen nicht verändert werden
   (`npm run build`, Output-Verzeichnis `.next`).
4. **Umgebungsvariablen setzen** (sobald E-Mail-Versand/KI-Chat angebunden
   sind): Project Settings → Environment Variables, z. B.
   - `RESEND_API_KEY` (oder Zugangsdaten des gewählten E-Mail-Dienstes)
   - `ANTHROPIC_API_KEY` (falls der Chat später an eine echte KI angebunden
     wird)
5. **Deploy** klicken. Vercel baut das Projekt und stellt es unter einer
   `*.vercel.app`-Domain bereit.
6. **Eigene Domain verbinden**: Project Settings → Domains →
   `fliesen-khalil.de` (bzw. gewünschte Domain) hinzufügen und die
   angezeigten DNS-Einträge beim Domain-Provider setzen.
7. **Metadaten prüfen**: In `lib/content.ts` das Feld `company.url` auf die
   endgültige Domain anpassen (wird u. a. für SEO-Metadaten, Sitemap und
   strukturierte Daten verwendet).

Nach jedem Push auf den verbundenen Branch baut Vercel automatisch neu und
aktualisiert die Live-Seite.
