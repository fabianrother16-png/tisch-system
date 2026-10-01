# Rother Marketing Cockpit

Die interne Agentur-Software für Rother Marketing („Marketing mit Gesicht.“): Kunden, Verträge, Content-Produktion,
Kalender, Performance aller Kanäle, Angebote, Rechnungen, Ausgaben, Buchhaltung,
Ablage und E-Mail – alles in einer Anwendung.

## Was die Software kann

| Bereich | Funktionen |
|---|---|
| **Dashboard** | Content-Soll pro Kunde („bei wem fehlen diesen Monat noch Videos/Termine?“), Hinweise (überfällige Rechnungen, Kündigungsfristen, Angebote ohne Antwort, fehlende Belege, gestörte Anbindungen), die nächsten 7 Tage, Aufgaben, Einnahmen, Top-Beitrag |
| **Kunden** | Kundenkatalog, Kundenakte mit Kontakten, Kanälen, Notizen/Gesprächsprotokollen, Verlauf, E-Mails, Dateien, Finanzen und Performance |
| **Verträge** | Paket, Vergütung, Laufzeit, automatische Verlängerung, Kündigungsfrist (inkl. „kündbar bis“), Leistungsumfang pro Monat (Videos, Beiträge, Vor-Ort-Termine), Werbebudget, Sonderbedingungen, Vertrags-PDF |
| **Content** | Board Idee → Geplant → Dreh → Schnitt → Kundenfreigabe → Eingeplant → Veröffentlicht (Drag & Drop), Monats-Soll, fehlende Videos mit einem Klick einplanen, Drehtermin direkt in den Kalender, veröffentlichte Videos landen automatisch in der Performance-Auswertung |
| **Kalender** | Monat/Woche/Agenda, Drehs & Vor-Ort-Termine (zählen auf das Vertrags-Soll), automatisch eingeblendete Fristen (Zahlungen, Kündigungsfristen, Postings, Aufgaben), Abo-Link für Google/Apple/Outlook-Kalender |
| **Aufgaben** | Pro Person oder Kunde, Fälligkeiten, Prioritäten, Schnell-Erfassung |
| **Performance** | Instagram, TikTok, Facebook, YouTube, Google-Unternehmensprofil, Meta Ads, Google Ads: Follower-Entwicklung, Aufrufe pro Monat, Top-Beiträge („viral“), Engagement, Website-Klicks/Anrufe/Routen über Google, Sterne & Bewertungen, Werbekennzahlen (Kosten, Klicks, CTR, CPC, Leads) und **Vorher → Nachher** |
| **Kunden-Report** | Öffentliche, schön gestaltete Report-Seite pro Kunde (geheimer Link, ohne Login) – „Das haben wir für Sie umgesetzt“, alle Diagramme, als PDF speicherbar, per Mail versendbar |
| **Tracking-Links & QR** | Eigene Kurzlinks (`/go/…`) für NFC-Bewertungskarten, Google-Profil, Bio-Links und Flyer mit Klickstatistik, QR-Code als PNG/SVG – funktioniert ohne jede API-Freigabe |
| **Angebote** | Editor mit Leistungskatalog, optionalen Positionen, Rabatt, PDF, Versand per Mail, angenommen/abgelehnt, mit einem Klick in Rechnung oder Vertrag umwandeln |
| **Rechnungen** | Fortlaufende Nummern erst beim Festschreiben, Festschreiben + PDF-Archiv (GoBD), Storno per Stornorechnung, Teilzahlungen, Zahlungserinnerungen, Serienrechnungen aus Verträgen, **E-Rechnung (XRechnung 3.0)**, Kleinunternehmer-Option |
| **Ausgaben** | Belege abfotografieren/hochladen, Kategorien (angelehnt an die Anlage EÜR), Vorsteuer, Kosten pro Kunde, Abos/Fixkosten, private Auslagen zwischen den Gesellschaftern |
| **Auswertung** | Einnahmen/Ausgaben/Gewinn pro Monat, vereinfachte EÜR, **Gewinnverteilung der GbR**, Umsatzsteuer pro Monat/Quartal (Ist- oder Soll-Versteuerung, ELSTER-Kennzahlen), Umsatz & Deckungsbeitrag je Kunde, offene Posten, Export für den Steuerberater (CSV + ZIP mit allen Belegen und Rechnungen) |
| **Ablage** | Ordner für Verträge, Angebote, Rechnungen, Belege, Briefings, Design, Medien, Reports, Intern – Rechnungen, angenommene Angebote, Verträge und Belege landen automatisch dort |
| **E-Mail** | Eigenes Postfach per SMTP/IMAP: Angebote, Rechnungen, Mahnungen und Reports direkt versenden, eingehende Kundenmails werden automatisch dem Kunden zugeordnet, Vorlagen mit Platzhaltern |
| **Sonstiges** | Globale Suche (Strg + K), „+ Neu“-Menü, Hell/Dunkel-Modus, Handy-tauglich, mehrere Zugänge, Datensicherung als JSON, Demo-Daten zum Ausprobieren |

## Technik

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Drizzle ORM
mit SQLite/libSQL (lokal eine Datei, online [Turso](https://turso.tech)) ·
Recharts · @react-pdf/renderer · Nodemailer/ImapFlow.

Die Software ist ein eigenständiges Projekt im Ordner `cockpit/`. Design (Farben,
Schriften, RM-Logo) und Leistungskatalog entsprechen der Website von Rother Marketing
(Repository `rother-marketing-website`).

## Lokal starten

```bash
cd cockpit
npm install
cp .env.example .env.local     # APP_SECRET eintragen (siehe Datei)
npm run dev
```

Danach <http://localhost:3100> öffnen. Beim ersten Aufruf legt ihr eure beiden Zugänge
an. Mit „Beispieldaten laden“ wird alles mit erfundenen Demo-Kunden gefüllt – unter
**Einstellungen → Daten & Sicherung** lassen sie sich mit einem Klick entfernen
(echte Daten und Nummernkreise bleiben unberührt).

Die Datenbank-Tabellen werden beim Start automatisch angelegt bzw. aktualisiert.

Weitere Befehle:

```bash
npm run build       # Produktions-Build
npm run start       # Produktions-Server (Port 3100)
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run db:generate # neue Migration nach Schema-Änderung (lib/db/schema.ts)
```

## Online stellen (Vercel + Turso)

1. **Datenbank:** Bei [turso.tech](https://turso.tech) (kostenloser Tarif reicht) eine
   Datenbank in der Region Frankfurt anlegen, URL (`libsql://…`) und Token notieren.
2. **Vercel:** Das Repository ein zweites Mal als neues Projekt importieren und als
   **Root Directory `cockpit`** wählen.
3. **Umgebungsvariablen** in Vercel setzen (Werte siehe `.env.example`):
   - `APP_SECRET` – langer Zufallswert (`openssl rand -base64 48`). Nicht mehr ändern,
     sonst können gespeicherte Passwörter/Tokens nicht mehr entschlüsselt werden.
   - `APP_URL` – z. B. `https://cockpit.rother-marketing.de`
   - `DATABASE_URL`, `DATABASE_AUTH_TOKEN` – von Turso
   - `CRON_SECRET` – Zufallswert; Vercel ruft damit täglich `/api/cron/daily` auf
4. Deployen, Domain verbinden (z. B. `cockpit.rother-marketing.de`), Einrichtung durchlaufen.

Der tägliche Job (siehe `vercel.json`) holt alle Kennzahlen der verbundenen Kanäle,
bereitet fällige Serienrechnungen als Entwurf vor, setzt abgelaufene Angebote auf
„abgelaufen“ und ruft das Postfach ab.

> **Dateien:** Belege, Verträge und PDFs werden in der Datenbank gespeichert (max.
> 10 MB pro Datei). Rohvideos gehören weiterhin in eure Cloud (Drive/Dropbox) – dort
> verlinken bzw. als Notiz ablegen.

## Plattformen verbinden

Für automatische Zahlen braucht jede Plattform eine eigene Entwickler-App. Die
Zugangsdaten tragt ihr unter **Einstellungen → Anbindungen** ein (oder als
Umgebungsvariablen); dort stehen auch die Weiterleitungs-URLs, die ihr in den Apps
hinterlegen müsst. Danach verbindet ihr beim Kunden unter **Anbindungen & Report**
per Klick dessen Konto.

| Plattform | Wo | Hinweise |
|---|---|---|
| Instagram | developers.facebook.com → App (Business) → Produkt „Instagram“ → API mit Instagram-Login | Business- oder Creator-Konto des Kunden nötig. Für fremde Konten ist ein App-Review durch Meta nötig. |
| Facebook-Seiten & Meta Ads | Meta-App mit Facebook Login for Business + Marketing API | Rechte `pages_read_engagement`, `read_insights`, `ads_read`. App-Review für Live-Betrieb. |
| TikTok | developers.tiktok.com → Login Kit + Display API | App-Prüfung durch TikTok (einige Tage). |
| Google Ads | Google Cloud OAuth-Client + Developer-Token aus dem Verwaltungskonto (MCC) | Basiszugriff beantragen. |
| Google-Unternehmensprofil | Google Cloud: Business Profile APIs aktivieren | Zugriff muss bei Google beantragt werden. |
| Google-Sterne (einfach) | Google Cloud: „Places API (New)“ + API-Schlüssel | Kein Kunden-Login nötig, nur die Place ID des Kunden. |

**Bis die Apps freigeschaltet sind**, könnt ihr alle Zahlen manuell erfassen
(Kundenakte → Performance → „Kennzahlen eintragen“ / „Beitrag“, Werbung → Kampagne).
Diagramme, Vorher/Nachher und Kunden-Report funktionieren damit genauso.
Tracking-Links und NFC-Karten-Klicks laufen sofort ohne jede Freigabe.

## Verbindung zur Website (Kontaktformular → Cockpit)

Anfragen aus dem Kontaktformular von **rother-marketing-website** landen automatisch
im Cockpit: als neuer Interessent (Status „Interessent“, Quelle
„Website-Kontaktformular“) mit Ansprechpartner, Verlaufseintrag mit allen Angaben
und der Aufgabe „Rückmeldung an … per Telefon/E-Mail“ für den nächsten Werktag.
Kommt dieselbe Person erneut (gleiche E-Mail oder gleicher Firmenname), wird die
Anfrage dem bestehenden Kunden zugeordnet. Neue Anfragen erscheinen oben auf dem
Dashboard und als Zähler bei „Kunden“.

Einrichten:

1. Cockpit → **Einstellungen → Anbindungen → Website-Anfragen** → „Verbindung einrichten“.
2. Die angezeigten Werte `COCKPIT_URL` und `COCKPIT_SCHLUESSEL` im Vercel-Projekt der
   Website eintragen und die Website neu deployen.

Technisch: `POST /api/website/anfrage` mit `Authorization: Bearer <Schlüssel>`. Die
Website prüft Pflichtfelder, Spam und Drosselung selbst; die Anfrage gilt dort als
angekommen, sobald Mail **oder** Cockpit geklappt hat. Alternativ kann der Schlüssel
im Cockpit auch über die Umgebungsvariable `WEBSITE_SCHLUESSEL` gesetzt werden.

## E-Mail

Unter **Einstellungen → E-Mail** SMTP (Versand) und optional IMAP (Empfang) eintragen
– funktioniert mit IONOS, Strato, Google Workspace (App-Passwort), Outlook usw.
„Verbindung testen“ prüft beides. Passwörter werden verschlüsselt gespeichert.

## Buchhaltung – gut zu wissen

- Rechnungsnummern werden erst beim **Festschreiben** vergeben (fortlaufend je Jahr,
  z. B. `RE-2026-0001`). Festgeschriebene Rechnungen sind unveränderlich; das PDF wird
  archiviert. Korrekturen laufen über **Stornieren** (eigene Stornorechnung).
- **E-Rechnung:** Für jede festgeschriebene Rechnung gibt es eine XRechnung-Datei
  (UN/CEFACT CII) zum Download bzw. als Mail-Anhang. Vor dem ersten produktiven
  Einsatz einmal mit einem Validator (z. B. KoSIT) prüfen. Pflicht im B2B-Bereich je
  nach Umsatz ab 2027/2028.
- Die **EÜR-Auswertung** folgt dem Zufluss-/Abflussprinzip (Zahlungsdatum) und ist eine
  Vorlage für Steuerberater/Anlage EÜR – sie ersetzt keine steuerliche Beratung.
- Kleinunternehmerregelung (§ 19 UStG) und Ist-/Soll-Versteuerung unter
  **Einstellungen → Rechnungen & Steuern**.

## Datenschutz & Sicherheit

- Login mit verschlüsselten Passwörtern (scrypt), signierte Sitzungs-Cookies,
  jede Server-Aktion prüft die Anmeldung.
- API-Tokens und Mail-Passwörter liegen AES-256-verschlüsselt in der Datenbank.
- Tracking-Links speichern **keine IP-Adressen** – nur Datum, Gerätetyp, Herkunftsseite
  und Land.
- Kunden-Reports sind nur mit dem geheimen Link erreichbar, lassen sich deaktivieren
  und der Link kann jederzeit neu erzeugt werden.
- Für Vercel und Turso einen Auftragsverarbeitungsvertrag (AVV) abschließen.

## Projektstruktur

```
cockpit/
  app/(auth)/         Login & Einrichtung
  app/(app)/          alle Seiten der Software (Dashboard, Kunden, Content, …)
  app/report/         öffentlicher Kunden-Report
  app/go/             Tracking-Link-Weiterleitung
  app/api/            PDFs, Exporte, OAuth, Kalender-Abo, Cron, Suche
  components/         UI-Bausteine, Diagramme, Formulare
  lib/db/             Datenbankschema (Drizzle) & Verbindung
  lib/actions/        Server Actions (alle Änderungen)
  lib/domain/         Geschäftslogik (Verträge, Soll/Ist, Rechnungen, Finanzen, Performance)
  lib/integrations/   TikTok, Instagram, Facebook, Meta Ads, Google Ads, Google-Profil
  lib/pdf/            Angebots-/Rechnungs-PDF und XRechnung
  drizzle/            SQL-Migrationen
```
