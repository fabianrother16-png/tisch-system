# Auftrag: „Rother Marketing Cockpit“ nachbauen – interne All-in-One-Software einer Marketing-Agentur

Du bist ein erfahrener Full-Stack-Entwickler. Baue die unten beschriebene Software **vollständig, lauffähig und getestet** nach. Diese Beschreibung ist die Spezifikation einer bereits existierenden, fertigen Anwendung. Halte dich genau daran: Datenmodell, Regeln, Seiten, Texte und Design. Wo etwas nicht festgelegt ist, entscheide selbst im selben Stil, ohne nachzufragen. Arbeite so lange, bis alles fertig ist und alle Prüfungen am Ende (Abschnitt 24) bestehen.

---

## 0. Kontext

- **Firma:** Rother Marketing, eine GbR mit zwei Gesellschaftern (Brüder). Claim: **„Marketing mit Gesicht.“**
- **Website der Agentur:** https://rother-marketing-website.vercel.app (eigenes Next.js-Projekt).
- **Leistungen der Agentur:**
  - Social Media (Reels und TikToks)
  - Foto und Video, inkl. Drohne
  - Webdesign
  - SEO und Local SEO
  - Google-Profil und Bewertungen
  - NFC-Bewertungskarten
  - Meta Ads und Google Ads
- **Wer die Software nutzt:**
  - Das „Cockpit“ ist nur für die zwei Inhaber gedacht.
  - Kunden sehen nur ihren persönlichen Report-Link.
- **Sprache:**
  - Die Oberfläche ist komplett Deutsch.
  - Intern wird geduzt („Tragt … ein“, „euer“).
  - Alles, was Kunden sehen (Report, PDFs, Mailvorlagen), ist in der Sie-Form.
- **Ziele:**
  - einfach, schön und logisch
  - entspannte Buchhaltung
  - man sieht immer, bei welchem Kunden noch ein Video fehlt
- **Bezeichner:**
  - Code-Bezeichner und Tabellen auf Englisch.
  - Fachbegriffe, Statuswerte und URLs auf Deutsch (`/kunden`, `status: "entwurf"`).

## 1. Arbeitsweise

1. **Projektordner:** Lege die App im Ordner `cockpit/` als eigenständiges Next.js-Projekt an, mit eigener `package.json`. Port 3100, `"type": "module"`.
2. **Phasen:** Arbeite in dieser Reihenfolge:
   1. Grundgerüst: Konfiguration, Datenbankschema, Login, Layout.
   2. Kunden, Kontakte, Verträge, Verlauf.
   3. Content-Produktion, Kalender, Aufgaben.
   4. Angebote, Rechnungen, PDF, Ausgaben, Finanzen.
   5. Performance, Plattform-Anbindungen, Tracking-Links, Kunden-Report.
   6. Ablage, E-Mail, Dashboard, Einstellungen, Suche, Website-Eingang.
   7. Demo-Daten, README, Tests.
3. **Prüfen nach jeder Phase:** `npm run typecheck`, `npm run lint` und `npm run build` müssen fehlerfrei durchlaufen.
4. **Keine erfundenen Zahlen:** Zeige in der Oberfläche keine erfundenen Kennzahlen. Beispieldaten gibt es nur als klar markierte Demo-Daten.
5. **Kommentare:** Schreibe kurze deutsche Kommentare nur dort, wo eine Regel nicht offensichtlich ist (GoBD, Zufluss-/Abflussprinzip usw.).

## 2. Tech-Stack (genau so verwenden)

- **Next.js 16** (App Router, Turbopack, Server Components, Server Actions). Diese Neuerungen von Version 16 beachten:
  - Der Routen-Schutz liegt in `proxy.ts` (exportiert `proxy`), nicht mehr in `middleware.ts`.
  - `params` und `searchParams` sind Promises und müssen mit `await` gelesen werden.
  - `next lint` gibt es nicht mehr; stattdessen ESLint 9 als Flat Config mit `eslint-config-next`.
  - `instrumentation.ts` mit `register()` führt beim Serverstart die Migrationen aus, nur wenn `NEXT_RUNTIME === "nodejs"`.
- **React 19.2:** `useActionState`, `useOptimistic`, `useTransition`.
- **Sprache:** TypeScript (strict). Import-Alias `@/*` zeigt auf das Projekt-Root.
- **Styling:** Tailwind CSS 4 über `@tailwindcss/postcss`. Theme-Farben als CSS-Variablen über `@theme inline`; Dark Mode über die Klasse `.dark` (`@custom-variant dark (&:where(.dark, .dark *))`).
- **Datenbank:**
  - Drizzle ORM 0.45 und drizzle-kit 0.31 mit `@libsql/client` 0.18.
  - Lokal die Datei `file:./data/cockpit.db`; online Turso über `DATABASE_URL` und `DATABASE_AUTH_TOKEN`.
  - Migrationen als SQL im Ordner `drizzle/`.
  - Bei lokaler Datei `PRAGMA foreign_keys = ON` und `busy_timeout = 5000`.
  - Client und DB im Dev-Modus über `globalThis` cachen.
- **Weitere Bibliotheken:**
  - `jose` (JWT HS256), `zod` v4, `clsx`, `server-only`
  - `recharts` 3, `lucide-react` 1.x (enthält **keine** Marken-Icons, deshalb eigene SVGs für Instagram, TikTok, Facebook, YouTube, Google, LinkedIn, Meta)
  - `@react-pdf/renderer` 4 für PDFs, `qrcode`, `fflate` für ZIP
  - `nodemailer` für SMTP, `imapflow` und `mailparser` für IMAP
  - `tsx` für Skripte
- **Skripte in `package.json`:**
  - `dev`: `next dev --port 3100`
  - `build`
  - `start`: `next start --port 3100`
  - `lint`: `eslint .`
  - `typecheck`: `tsc --noEmit`
  - `db:generate`: `drizzle-kit generate`
  - `db:migrate`: `tsx scripts/migrate.ts`
- **`vercel.json`:** ein Cron `{ "path": "/api/cron/daily", "schedule": "0 4 * * *" }`.

## 3. Konventionen

- **Geld** immer als Integer in **Cent**.
  - `parseMoney("1.234,56")` ergibt 123456. Es akzeptiert Komma und Punkt sowie Tausenderpunkte.
  - `eur(cents)` formatiert über `Intl` als `de-DE`, EUR.
- **Datum:**
  - Reine Datumswerte als Text `"YYYY-MM-DD"`.
  - Termine als lokale Wandzeit `"YYYY-MM-DDTHH:mm"` in Europe/Berlin.
  - Zeitstempel (`created_at` usw.) als ISO-String in UTC.
  - `todayISO()` und `nowLocal()` rechnen immer in **Europe/Berlin** (mit `Intl`).
- **Datums-Helfer** in `lib/dates.ts`:
  - addDays, addMonths, diffDays, monthKey, currentMonth
  - startOfMonth, endOfMonth, addMonthKey, startOfWeek (Montag)
  - dayOfWeek (0 = Montag … 6 = Sonntag), eachDay, monthsBetween, isoWeek, quarterOf
- **Format-Helfer** in `lib/format.ts`:
  - eur, eurRound, centsToInput, parseMoney, parseNumber
  - fmtNumber, fmtDecimal, fmtCompact (ab 1 Mio. „1,2 Mio.“, sonst ganze Zahl mit Tausenderpunkt), fmtPercent, fmtRate
  - fmtDate (TT.MM.JJJJ), fmtDateShort, fmtDateLong („1. Oktober 2026“), fmtDateTime, fmtTime, fmtTimestamp
  - fmtMonth („Oktober 2026“), fmtMonthShort
  - relativeDays („heute“, „morgen“, „gestern“, „in 3 Tagen“, „vor 2 Tagen“)
  - fmtBytes, initials, pctChange
- **Server Actions:**
  - Signatur: `(…gebundeneIds, _prev: ActionState, fd: FormData) => Promise<ActionState>`.
  - Typ: `ActionState = { ok: boolean; message?: string; errors?: Record<string,string>; redirectTo?: string; data?: Record<string,unknown> } | null`.
  - Helfer: `success(message, extra)` und `fail(message, errors)`.
  - Formulardaten mit den Helfern aus `lib/forms.ts` lesen (str, reqStr, int, optInt, money, bool, date).
  - Jede Action ruft zuerst `assertUser()` auf, validiert mit zod und ruft danach `revalidatePath` für alle betroffenen Seiten auf.
- **Client-Bausteine** (`components/ui/form.tsx`):
  - `ActionForm` (useActionState): zeigt einen Toast mit `message`, zeigt Feldfehler, schließt das umgebende Modal und folgt `redirectTo`. Toast und Weiterleitung passieren direkt im Action-Callback, nicht in einem Effect.
  - `ActionButton` (useTransition): optional mit `confirm`-Dialog.
- **Verlauf:** Jedes wichtige Ereignis wird mit `logActivity()` in `activities` geschrieben. Das erscheint im Verlauf des Kunden und unter „Zuletzt passiert“ auf dem Dashboard.
- **Rendering:** Alle Seiten mit Datenbankzugriff werden dynamisch gerendert (`await connection()` bzw. dynamische Nutzung). Es gibt keine statische Generierung von Datenseiten.

## 4. Anmeldung und Sicherheit

**Ersteinrichtung `/setup`**
- Nur möglich, solange noch kein Benutzer existiert; sonst Hinweis „Die Einrichtung wurde bereits abgeschlossen.“
- Felder:
  - Firmenname (vorbelegt „Rother Marketing“)
  - dein Name, E-Mail, Passwort (mindestens 10 Zeichen)
  - optional: zweiter Gesellschafter mit Name, E-Mail und Passwort (mindestens 10 Zeichen)
  - Checkbox „Demo-Daten laden“
- Beim Absenden:
  1. Benutzer anlegen: Rolle `inhaber`, Farben `#7A5C33` bzw. `#2563EB`, Kalender-Token.
  2. Firmendaten setzen: `company.name` und `company.owners` = „A & B“.
  3. `partners` auf 50/50 setzen, bei nur einer Person 100.
  4. Leistungskatalog aus den Vorlagen anlegen (Preis 0).
  5. Optional Demo-Daten laden.
  6. `setup.completedAt` setzen, anmelden, weiter zu `/`.

**Login `/login`**
- E-Mail und Passwort; `lastLoginAt` wird gesetzt.
- Bei Erfolg zurück zu `?next=`.
- Das Login-Layout ist zentriert: Logo, Claim, Karte.

**Session**
- Cookie `cockpit_session` mit einem JWT (HS256) `{ uid }`, gültig 30 Tage.
- Cookie-Einstellungen: httpOnly, sameSite lax, secure in Produktion.

**`proxy.ts`**
- Öffentliche Pfade: `/login`, `/setup`, `/go/`, `/report/`, `/api/cron/`, `/api/calendar/`, `/api/website/`.
- Alles andere: Cookie prüfen.
  - API-Anfragen ohne gültige Session bekommen `401 {error:"Nicht angemeldet"}`.
  - Seiten leiten auf `/login?next=…` um.
- Matcher schließt aus: `_next/static`, `_next/image`, `favicon.ico`, `icon.svg`, `robots.txt`.
- Seiten rufen `requireUser()` auf (leitet um), Actions und Routen rufen `assertUser()` auf (wirft). Der Benutzer muss `active` sein.

**Passwörter**
- scrypt mit 16 Byte Salt und 64 Byte Hash.
- Format `scrypt$<saltB64>$<hashB64>`, Vergleich mit `timingSafeEqual`.

**Geheimnisse in der Datenbank**
- Betroffen: SMTP- und IMAP-Passwort, Client-Secrets der OAuth-Apps, Access- und Refresh-Tokens, Website-Schlüssel.
- Verschlüsselung: AES-256-GCM, Schlüssel = `sha256("enc:" + APP_SECRET)`.
- Format: `v1.<iv>.<tag>.<data>`, jeweils base64url.

**`APP_SECRET`**
- Mindestens 32 Zeichen.
- In Produktion einen Fehler werfen, wenn es fehlt (außer während des Builds, `NEXT_PHASE`).
- Im Dev-Modus einen festen Fallback verwenden.

**Weitere Regeln**
- `robots: noindex` auf allen Seiten.
- Von Link-Klicks werden **keine IP-Adressen** gespeichert.
- Alle Benutzer haben dieselben Rechte. Das Feld `role` (inhaber/mitarbeiter) existiert, wird aber nicht durchgesetzt.

## 5. Datenmodell (Drizzle, SQLite/libSQL)

Notation: `feld: typ = default`. `id` ist immer ein Integer-Primärschlüssel mit Autoincrement. `created_at` und `updated_at` sind ISO-Text, Default jetzt.

```
users: name, email (unique), password_hash, role enum[inhaber,mitarbeiter]=inhaber, color="#C1502E",
  calendar_token, active bool=true, last_login_at, created_at
settings: key (PK), value (JSON-Text), updated_at

customers: number (unique, "K-1001"), name, industry, status enum[lead,aktiv,pausiert,ehemalig]=aktiv,
  email, phone, website, street, zip, city, country="Deutschland", vat_id, color="#C1502E",
  owner_id→users (set null), start_date, source, instagram_handle, tiktok_handle, facebook_url,
  youtube_url, google_business_url, google_place_id, payment_term_days (int, optional),
  report_token, report_enabled bool=false, notes, is_demo bool=false, created_at, updated_at
  index(status)
contacts: customer_id→customers (cascade), name, position, email, phone, is_primary bool, notes, created_at
baselines (Ausgangswerte „vorher“): customer_id (cascade), platform, metric, value real, date, note
  unique(customer_id, platform, metric)
contracts: customer_id (cascade), title, status enum[entwurf,aktiv,gekuendigt,beendet]=aktiv,
  start_date, end_date, min_term_months=0, notice_period=0, notice_unit enum[tage,wochen,monate]=monate,
  auto_renew_months=0, monthly_fee (Cent)=0, setup_fee=0,
  billing_interval enum[monatlich,quartalsweise,halbjaehrlich,jaehrlich,einmalig]=monatlich,
  auto_invoice bool=false, next_invoice_date, videos_per_month=0, posts_per_month=0,
  visits_per_month=0, ad_budget_monthly=0, services JSON string[]=[], conditions, notes, file_id,
  signed_at, cancelled_at, created_at, updated_at

services (Leistungskatalog): name, description, category, unit="Pauschale", unit_price=0, tax_rate=19,
  active=true, sort_order=0
quotes: number (unique "AN-2026-0001"), customer_id (restrict), contact_id, title,
  status enum[entwurf,versendet,angenommen,abgelehnt,abgelaufen]=entwurf, issue_date, valid_until,
  intro, outro, discount_percent real=0, net_total, tax_total, gross_total, sent_at, decided_at,
  invoice_id, contract_id, created_by, created_at, updated_at
quote_items: quote_id (cascade), position, title, description, quantity real=1, unit="Pauschale",
  unit_price, tax_rate=19, optional bool=false
invoices: number (unique, NULL solange Entwurf), kind enum[rechnung,storno]=rechnung,
  customer_id (restrict), quote_id, contract_id, cancels_invoice_id, title,
  status enum[entwurf,offen,teilbezahlt,bezahlt,storniert]=entwurf, issue_date, service_from,
  service_to, due_date, intro, outro, discount_percent, net_total, tax_total, gross_total,
  paid_total, finalized_at, sent_at, paid_at, reminder_level=0, last_reminder_at, created_by, …
  index(customer_id), index(status)
invoice_items: wie quote_items ohne optional
payments: invoice_id (cascade), date, amount, method="ueberweisung", note, created_at
expenses: date, vendor, description, category="sonstiges", net_amount, tax_rate=19, tax_amount,
  gross_amount, customer_id (set null), paid_by_user_id,
  payment_method enum[geschaeftskonto,privat_auslage]=geschaeftskonto, reimbursed bool=false,
  recurring enum[nein,monatlich,jaehrlich]=nein, receipt_file_id, notes, is_demo, created_at

contents (Content-Produktion): customer_id (cascade), title, format="reel", platforms JSON string[],
  status="idee", assignee_id→users, period_month ("YYYY-MM", Pflicht), shoot_date, due_date,
  publish_date, concept, notes, published_url, client_approved bool, sort_order, created_at, updated_at
posts (veröffentlichte Beiträge): customer_id (cascade), content_id, platform, external_id, url,
  caption, media_type, thumbnail_url, published_at, views, reach, likes, comments, shares, saves,
  source enum[manuell,api]=manuell, last_synced_at, created_at; unique(platform, external_id)
post_snapshots: post_id (cascade), date, views, reach, likes, comments, shares, saves; unique(post_id,date)
metrics_daily (Tageswerte Konto): customer_id, platform, metric, date, value real, source;
  unique(customer_id, platform, metric, date)
ad_campaigns: customer_id, platform (meta|google|tiktok), external_id, name, status="aktiv", objective,
  daily_budget, start_date, end_date, source; unique(platform, external_id)
ad_stats_daily: campaign_id (cascade), date, spend (Cent), impressions, reach, clicks,
  conversions real, conversion_value (Cent); unique(campaign_id, date)
integrations: customer_id, provider, external_id, name, access_token (verschl.), refresh_token
  (verschl.), expires_at, scopes, config JSON, status enum[aktiv,fehler,getrennt], last_sync_at, last_error
tracking_links: customer_id, slug (unique, klein), label, target_url, channel="sonstiges", active,
  click_count, created_at
link_clicks: link_id (cascade), at, date, device (mobil|tablet|desktop), referrer (nur Domain), country

events (Kalender): title, type="meeting", start, end, all_day, location, customer_id (set null),
  content_id, assignee_ids JSON number[], counts_as_visit bool, notes, is_demo, created_by, created_at
tasks: title, description, customer_id (cascade), assignee_id, due_date,
  priority enum[niedrig,normal,hoch]=normal, status enum[offen,erledigt]=offen, completed_at, is_demo, …
activities: customer_id, user_id, kind="notiz" (notiz|anruf|meeting|email|anfrage|system), title, body,
  ref_type, ref_id, created_at; index(customer_id, created_at)

files (Ablage): customer_id (set null), name, category="sonstiges", mime_type, size, storage_key (unique),
  ref_type, ref_id, notes, uploaded_by, created_at
file_blobs: key (PK), data BLOB   ← Dateien liegen direkt in der DB (max. 10 MB je Datei)
emails: direction enum[aus,ein], customer_id, from_addr, to_addr, cc, subject, text, html,
  message_id (unique), in_reply_to, status enum[gesendet,fehler,empfangen], error, ref_type, ref_id,
  attachments JSON string[] (Dateinamen), user_id, is_read bool=true, date, created_at
```

Lege sinnvolle Indizes an, z. B. auf `customer_id` und Datumsfelder.

## 6. Einstellungen (Tabelle `settings`, JSON je Schlüssel)

`getSetting(key)` mischt den gespeicherten Wert über die Defaults. `setSetting` schreibt per Upsert. `fillTemplate()` ersetzt `{{platzhalter}}`.

**`company`** (Firmendaten)
- name „Rother Marketing“, claim „Marketing mit Gesicht.“, legalForm „GbR“, accentColor „#7A5C33“
- country „Deutschland“
- leer vorbelegt: owners, street, zip, city, email, phone, website, taxNumber, vatId, bankName, iban, bic

**`invoicing`** (Rechnungen und Steuern)

| Schlüssel | Default |
|---|---|
| kleinunternehmer | false |
| taxationMode | "ist" (alternativ "soll") |
| defaultTaxRate | 19 |
| paymentTermDays | 14 |
| quoteValidityDays | 30 |
| invoicePrefix / quotePrefix / customerPrefix | "RE" / "AN" / "K" |
| reminderDays | 7 |
| reminderFee | 0 |

Vorlagentexte:
- invoiceIntro: „vielen Dank für Ihr Vertrauen. Wir berechnen Ihnen folgende Leistungen:“
- invoiceOutro: „Bitte überweisen Sie den Rechnungsbetrag bis zum {{faellig}} unter Angabe der Rechnungsnummer.“
- quoteIntro: „vielen Dank für Ihr Interesse. Gerne unterbreiten wir Ihnen folgendes Angebot:“
- quoteOutro: „Wir freuen uns auf die Zusammenarbeit. Bei Fragen sind wir jederzeit für Sie da.“

**`partners`**: `[{ name, share }]`, Default zweimal 50.

**`mail`**
- SMTP: smtpHost, smtpPort 587, smtpSecure false, smtpUser, smtpPassword (verschlüsselt)
- Absender: fromName, fromAddress
- IMAP: imapHost, imapPort 993, imapUser, imapPassword (verschlüsselt)
- signature, bccSelf false
- Fallback auf die Umgebungsvariablen `SMTP_*` und `IMAP_*`.

**`mailTemplates`** (Betreff und Text; Platzhalter `{{nummer}}`, `{{firma}}`, `{{ansprechpartner}}`, `{{betrag}}`, `{{gueltig_bis}}`, `{{faellig}}`, `{{datum}}`, `{{offen}}`, `{{absender}}`, `{{link}}`):

- **angebot**
  - Betreff: „Ihr Angebot {{nummer}} – {{firma}}“
  - Text: „Hallo {{ansprechpartner}},\n\nanbei erhalten Sie unser Angebot {{nummer}} über {{betrag}}.\nDas Angebot ist gültig bis {{gueltig_bis}}.\n\nBei Fragen melden Sie sich jederzeit gerne.\n\nViele Grüße\n{{absender}}“
- **rechnung**
  - Betreff: „Rechnung {{nummer}} – {{firma}}“
  - Text: „Hallo {{ansprechpartner}},\n\nanbei erhalten Sie unsere Rechnung {{nummer}} über {{betrag}}.\nBitte überweisen Sie den Betrag bis zum {{faellig}}.\n\nVielen Dank für die gute Zusammenarbeit!\n\nViele Grüße\n{{absender}}“
- **mahnung**
  - Betreff: „Zahlungserinnerung: Rechnung {{nummer}}“
  - Text: „Hallo {{ansprechpartner}},\n\nsicher ist es Ihnen im Alltag durchgerutscht: Unsere Rechnung {{nummer}} vom {{datum}} über {{offen}} ist seit dem {{faellig}} fällig.\n\nWir bitten um Ausgleich innerhalb der nächsten 7 Tage. Sollte sich Ihre Zahlung mit dieser Erinnerung überschnitten haben, betrachten Sie diese bitte als gegenstandslos.\n\nViele Grüße\n{{absender}}“
- **report**
  - Betreff: „Ihr Marketing-Report – {{firma}}“
  - Text: „Hallo {{ansprechpartner}},\n\nunter folgendem Link finden Sie jederzeit Ihren aktuellen Report mit allen Zahlen zu Ihren Kanälen:\n\n{{link}}\n\nViele Grüße\n{{absender}}“

**`oauthApps`**: `{ tiktok|instagram|meta|google|googleAds|googlePlaces: { clientId, clientSecret (verschlüsselt) } }`
- `googleAds.clientSecret` speichert den Developer-Token, `googleAds.clientId` die Login-Customer-ID.
- `googlePlaces.clientSecret` speichert den API-Key.

**`website`**: `{ key (verschlüsselt), lastReceivedAt, received }`

**`setup`**: `{ demoLoaded, completedAt }`

## 7. Auswahllisten (`lib/constants.ts`)

Jede Option hat `{value, label, tone}`. Mögliche tones: neutral, accent, green, amber, red, blue, violet.

**Kunden und Verträge**
- **Kundenstatus:** lead „Interessent“ (blau), aktiv „Aktiv“ (grün), pausiert „Pausiert“ (amber), ehemalig „Ehemalig“ (neutral).
- **Vertragsstatus:** entwurf „Entwurf“, aktiv „Aktiv“ (grün), gekuendigt „Gekündigt“ (amber), beendet „Beendet“.
- **Abrechnungsintervall** (Monate): monatlich 1, quartalsweise 3, halbjaehrlich 6, jaehrlich 12, einmalig 0.
- **Kündigungsfrist-Einheit:** tage, wochen, monate.

**Angebote, Rechnungen, Ausgaben**
- **Angebotsstatus:** Entwurf, Versendet (blau), Angenommen (grün), Abgelehnt (rot), Abgelaufen (amber).
- **Rechnungsstatus:** Entwurf, Offen (blau), Teilbezahlt (amber), Bezahlt (grün), Storniert.
- **Zahlungsarten:** ueberweisung, lastschrift, paypal, bar, karte, sonstiges.
- **Einheiten:** Pauschale, Stück, Stunde, Tag, Monat, Video, Beitrag, km.
- **Steuersätze:** 19, 7, 0.
- **Ausgabe-Kategorien** (angelehnt an die Anlage EÜR):
  - werbung „Werbekosten / Ads“, software „Software & Abos“, equipment „Equipment & Technik“
  - fremdleistung „Fremdleistungen / Freelancer“, fahrtkosten, kfz, buero „Büro & Material“
  - telefon „Telefon & Internet“, miete „Miete & Raumkosten“, versicherung „Versicherungen & Beiträge“
  - beratung „Steuerberatung & Recht“, weiterbildung, bewirtung, bank „Bank & Gebühren“, sonstiges

**Content**
- **Formate:**
  - reel „Reel / Kurzvideo“, tiktok, youtube „YouTube-Video“, imagefilm, drohne „Drohnenvideo“
  - post „Bild-Post“, karussell, story, ad „Werbeanzeige“, foto „Fotoshooting“, sonstiges
  - Diese Formate zählen als **Video**: reel, tiktok, youtube, imagefilm, drohne, ad.
- **Status** (zugleich die Spalten des Boards):
  - idee „Idee“, geplant „Geplant“ (blau), dreh „Dreh“ (violett), schnitt „Schnitt“ (accent)
  - freigabe „Kundenfreigabe“ (amber), eingeplant „Eingeplant“ (blau), veroeffentlicht „Veröffentlicht“ (grün)
  - **Geliefert:** eingeplant, veroeffentlicht. **In Arbeit:** geplant, dreh, schnitt, freigabe.

**Plattformen und Kennzahlen**
- **Plattformen und Farben:**
  - instagram #D6336C, tiktok #111111, facebook #1877F2, youtube #FF0000
  - google #1A73E8, linkedin #0A66C2, website #6B7280, meta #0866FF
- **Werbe-Plattformen:** meta „Meta (Instagram & Facebook)“, google „Google Ads“, tiktok „TikTok Ads“.
- **Konto-Kennzahlen** (`platform:metric`, Art):

| Plattform | Bestand | Zeitraum |
|---|---|---|
| instagram | followers | reach, profile_views |
| tiktok | followers, likes_total | – |
| facebook | followers | reach |
| youtube | followers (Abonnenten) | – |
| google | rating (Sterne), review_count | website_clicks, call_clicks, direction_requests, impressions |
| website | – | visitors |

  Bestandswerte zählen jeweils den letzten Wert, Zeitraumwerte werden summiert. Die Beschriftungen sind deutsch, z. B. „Website-Klicks (Google-Profil)“.

**Termine, Aufgaben, Ablage, Links, Verlauf**
- **Termin-Typen:**
  - dreh „Dreh / Shooting“ (violett), vor_ort „Vor-Ort-Termin“ (accent), meeting (blau), call „Telefonat / Call“ (blau)
  - deadline (rot), posting „Veröffentlichung“ (grün), intern (neutral), privat „Abwesend / Urlaub“ (amber)
  - Als **Besuch** zählen die Typen dreh und vor_ort.
- **Aufgaben-Priorität:** niedrig, normal (blau), hoch (rot).
- **Ablage-Kategorien:**
  - vertrag, angebot, rechnung, beleg, briefing „Briefings & Konzepte“, design „Design & Branding“
  - medien „Fotos & Videos“, report, intern „Intern / GbR“, sonstiges
- **Link-Kanäle:**
  - google „Google-Unternehmensprofil“, nfc „NFC-Bewertungskarte“, qr „QR-Code / Flyer“
  - instagram „Instagram-Bio“, tiktok „TikTok-Bio“, facebook, anzeige „Werbeanzeige“, website, sonstiges
- **Verlauf-Arten:** notiz, anruf „Telefonat“, meeting, email, anfrage „Website-Anfrage“, system.

**Farben und Leistungskatalog**
- **Kundenfarben** (reihum vergeben): #7A5C33, #2563EB, #059669, #7C3AED, #DB2777, #B4533A, #0891B2, #4F46E5, #65A30D, #475569.
- **Vorlagen für den Leistungskatalog** (Name, Kategorie, Einheit):

| Name | Kategorie | Einheit |
|---|---|---|
| Analyse und Fahrplan | Strategie | Pauschale |
| Webdesign | Website | Pauschale |
| SEO und Local SEO | Website | Monat |
| Google-Profil und Bewertungen | Google | Monat |
| NFC-Bewertungskarten | Google | Stück |
| Social Media | Social Media | Monat |
| Meta Ads und Google Ads | Werbung | Monat |
| Foto und Video | Foto & Video | Pauschale |
| Videoproduktion (Reel/TikTok) | Foto & Video | Video |
| Drehtag vor Ort | Foto & Video | Tag |
| Fahrtkosten | Sonstiges | km |

## 8. Fachlogik (`lib/domain/*`) – genau so umsetzen

### 8.1 Content-Soll pro Monat – `getMonthlyQuota(month, customerId?)`

1. **Verträge sammeln:** Berücksichtige Verträge mit Status aktiv oder gekuendigt, die vor Monatsende beginnen und nicht vor Monatsanfang geendet haben. Verträge ohne Video-, Post- und Besuchs-Umfang fallen weg.
2. **Soll je Kunde:** Summiere `videos/posts/visitsPerMonth` pro Kunde.
3. **Content zählen:** Nimm den Content des Monats (`period_month`). Videoformate kommen in den Topf „Videos“, alles andere in „Posts“.
   - Status eingeplant/veroeffentlicht zählt als **geliefert**.
   - geplant/dreh/schnitt/freigabe zählt als **in Arbeit**.
   - Bei Videos im Status „idee“ zählt es als **Idee**.
4. **Besuche zählen:** Termine des Kunden im Monat mit Typ dreh/vor_ort oder `counts_as_visit`. Liegt der Termin vor jetzt, ist er **erledigt**, sonst **geplant**.
5. **Fehlende Menge:** `fehlt = max(0, Soll − geliefert − in Arbeit)`. Für Besuche: `max(0, Soll − erledigt − geplant)`.
6. **Sortierung:** absteigend nach `(Video-Soll − geliefert) + fehlende Besuche`, dann nach Name.

### 8.2 Vertragslaufzeit – `contractTerm(c, today)`

- **Entwurf oder beendet:** keine Fristen; Label „Entwurf“ bzw. „Beendet“.
- **Verlängerung:** `renews = autoRenewMonths > 0` und nicht gekündigt.
- **Gekündigt:** Laufzeitende = `end_date`.
- **Mit Mindestlaufzeit:** Ende = Start + `minTermMonths` − 1 Tag. Verlängert sich der Vertrag, wird das Ende so lange um `autoRenewMonths` weitergeschoben, bis es ≥ heute ist (höchstens 200 Schritte).
- **Sonst:** Ende = `end_date`, falls vorhanden.
- **Kündigungsdeadline** (nur bei Status aktiv): Laufzeitende minus Frist in Tagen, Wochen oder Monaten. Dazu `daysToNotice` und `daysToEnd`.
- **Labels:** „Unbefristet“, „Befristet“, „Verlängert sich um X Mon.“, „Gekündigt“, „Gekündigt (Ende offen)“.
- **Hilfsfunktionen:**
  - `noticeLabel` liefert „jederzeit“ oder z. B. „1 Monat“ / „3 Monate“ / „2 Wochen“.
  - `monthlyValue` (MRR) = monatliche Gebühr, nur bei aktiven, nicht einmaligen Verträgen.
  - `amountPerBilling` = Gebühr × Monate des Intervalls.

### 8.3 Nummernkreise

- **Kunden:** `K-1001`, `K-1002` … (beginnt bei mindestens 1001).
- **Angebote:** `AN-<Jahr>-0001`.
- **Rechnungen:** `RE-<Jahr>-0001`.
  - Fortlaufend und lückenlos; die Nummer wird **erst beim Festschreiben** vergeben.
  - Jahr = Jahr des Rechnungsdatums.
  - Nächste Nummer = höchste vorhandene Nummer mit diesem Präfix + 1.
- Die Präfixe kommen aus den Einstellungen.

### 8.4 Summen – `computeTotals(items, discountPercent, kleinunternehmer)`

1. Optionale Positionen zählen nicht mit.
2. Zeilennetto = `round(Menge × Einzelpreis)`.
3. Netto je Steuersatz gruppieren, den Rabattfaktor je Satz anwenden und runden. Die Steuer je Satz wird ebenfalls gerundet.
4. Bei Kleinunternehmer ist jeder Satz 0.
5. Ergebnis: `{ subtotal, discount, net, tax, gross, byRate[] }`, `byRate` absteigend nach Steuersatz.

### 8.5 Rechnungen (GoBD-konform)

- **Entwurf:**
  - Keine Nummer; voll bearbeitbar.
  - Das PDF trägt das Wasserzeichen „ENTWURF“.
  - Nur Entwürfe dürfen gelöscht werden.
  - `recalcInvoice` rechnet nur Entwürfe aus den Positionen neu. Festgeschriebene Rechnungen behalten ihre Beträge.
- **Festschreiben** (`finalizeInvoice`), mit Bestätigung „Rechnung festschreiben? Danach erhält sie eine Nummer und ist nicht mehr änderbar.“:
  1. Ohne Positionen gibt es einen Fehler.
  2. Nummer vergeben, Status offen, `finalized_at` setzen.
  3. Das PDF wird erzeugt und **in der Ablage archiviert** (Kategorie rechnung, `ref_type` invoice). Danach wird immer dieses archivierte PDF ausgeliefert.
  4. Verlaufseintrag „Rechnung RE-… erstellt“.
- **„Als versendet markieren“** = festschreiben + `sent_at` (z. B. für Post-Versand).
- **Zahlungen:**
  - Zahlung erfassen: Datum, Betrag (vorbelegt mit dem offenen Rest), Zahlungsart, Notiz. Zahlungen lassen sich löschen.
  - Button „Vollständig bezahlt“ bucht den offenen Rest.
  - Nach jeder Zahlung wird der Status abgeleitet:
    - bezahlt ≥ brutto → **bezahlt**; `paid_at` = Datum der letzten Zahlung
    - mehr als 0 bezahlt → **teilbezahlt**
    - sonst → **offen**
- **Storno** (`cancelInvoice`): nur für festgeschriebene Rechnungen, die noch nicht storniert sind und selbst keine Storno sind.
  1. Neue Rechnung mit `kind = storno`, `cancels_invoice_id`, Titel „Storno zu RE-…: …“, denselben Positionen und **negativen** Beträgen (Vorzeichen −1).
  2. Sie bekommt eine eigene Nummer und den Status storniert.
  3. Das Original wird auf storniert gesetzt.
  4. Das Storno-PDF wird archiviert.
  5. Im PDF steht der Satz „Diese Stornorechnung hebt die Rechnung RE-… vollständig auf.“
- **Versand per E-Mail:**
  - Modal mit vorausgefüllter Vorlage. Empfänger = primärer Kontakt bzw. Kunden-E-Mail.
  - Anhänge: archiviertes PDF und optional die **XRechnung-XML** (Checkbox).
  - Setzt `sent_at` und schreibt einen Verlaufseintrag.
- **Zahlungserinnerung:** Mail mit der Vorlage „mahnung“; erhöht `reminder_level` um 1 und setzt `last_reminder_at`.
- **Duplizieren:** erzeugt einen neuen Entwurf mit heutigem Datum.
- **Detailseite:**
  - Links: PDF-Vorschau (iframe auf `/api/invoices/[id]/pdf`).
  - Rechts: Gesamtbetrag, Netto, USt, Bezahlt, Offen, Rechnungsdatum, Leistungszeitraum, Fällig, Versendet, Bezahlt am, Links „Storno zu“ bzw. „Storniert durch“, Zahlungsliste.
  - Buttons je nach Status: Bearbeiten, Festschreiben, PDF, E-Rechnung (XML), E-Mail senden, Zahlung erfassen, Zahlungserinnerung, Stornieren, Duplizieren, Entwurf löschen.

### 8.6 Serienrechnungen – `generateRecurringInvoices()`

- **Wann:** beim Laden des Dashboards, über den Button auf der Rechnungsseite und im täglichen Cron.
- **Welche Verträge:** `auto_invoice` gesetzt, Status aktiv oder gekuendigt, `next_invoice_date` ≤ heute.
- **Schleife:** Solange `next` ≤ heute (höchstens 24 Durchläufe) und nicht nach `end_date`:
  1. Leistungszeitraum = `next` bis `next + Intervall − 1 Tag`. Beschriftung „Oktober 2026“ bei monatlich, sonst „TT.MM.JJJJ – TT.MM.JJJJ“.
  2. Position: Vertragstitel; Beschreibung „Leistungszeitraum …“ + „\nEnthalten: <Leistungen>“; Menge = Monate; Einheit Monat; Preis = monatliche Gebühr; Standard-Steuersatz.
  3. Bei der allerersten Rechnung des Vertrags zusätzlich „Einrichtung / Onboarding“ (`setup_fee`).
  4. Daraus einen **Entwurf** anlegen mit Titel „<Vertrag> – <Zeitraum>“, Datum = max(next, heute), Fälligkeit nach dem Zahlungsziel des Kunden bzw. der Einstellung, Intro/Outro aus den Einstellungen.
  5. Verlaufseintrag „Serienrechnung vorbereitet (…)“.
- **Einmalige Verträge:** nach einer Rechnung `auto_invoice = false`.
- **Danach:** `next_invoice_date` weiterschieben.
- Die Entwürfe erscheinen auf dem Dashboard als Hinweis zur Prüfung.

### 8.7 Angebote

- **Editor** (gemeinsamer `DocumentEditor` mit Rechnungen):
  - Felder: Kunde, Datum, Gültig bis (Datum + `quoteValidityDays`) bzw. Zahlbar bis, Betreff, Leistungszeitraum von/bis (nur Rechnung, Hinweis „Pflichtangabe auf Rechnungen (§ 14 UStG)“), Einleitungstext.
  - Positionstabelle mit: Auswahl aus dem Leistungskatalog, Titel, Beschreibung, „Optionale Position (nicht in Summe)“ (nur Angebot), Menge, Einheit, Einzelpreis, Steuersatz, Sortieren hoch/runter, Entfernen.
  - Darunter: Rabatt in %, Schlusstext (Hinweis „Platzhalter: {{faellig}} = Fälligkeitsdatum“) und Live-Summen.
- **Status:** Entwurf → Versendet → Angenommen/Abgelehnt; abgelaufen automatisch per Cron.
- **Angenommen:** Eine PDF-Kopie „Angebot AN-… – Kunde (angenommen).pdf“ wird in der Ablage archiviert (Kategorie angebot), plus Verlaufseintrag „… angenommen 🎉“.
- **E-Mail-Versand** mit dem PDF setzt den Status versendet.
- **„In Rechnung umwandeln“:** Rechnungsentwurf ohne die optionalen Positionen; das Angebot wird angenommen. Danach weiter auf `/rechnungen/[id]?bearbeiten=1`.
- **„In Vertrag umwandeln“:** Vertragsentwurf mit:
  - Startdatum heute, Mindestlaufzeit 6, Kündigungsfrist 1 Monat, Verlängerung 3 Monate
  - monatliche Gebühr = Summe der Positionen mit Einheit „Monat“
  - Einrichtungsgebühr = Summe der übrigen Positionen
  - Leistungen = Titel der Positionen
- Außerdem: Duplizieren und Löschen.

### 8.8 Ausgaben

- **Betrag:** Eingabe brutto oder netto (Umschalter) mit Steuersatz; Netto/Steuer/Brutto werden berechnet. Bei Kleinunternehmer gilt Netto = Brutto und Steuer = 0.
- **Weitere Felder:** Kunde zuordnen (für den Deckungsbeitrag), bezahlt von (Benutzer), Zahlweg „Geschäftskonto“ oder „Privat ausgelegt“.
- **Beleg:** Upload mit `accept="application/pdf,image/*" capture="environment"` – auf dem Handy öffnet sich direkt die Kamera. Der Beleg landet in der Ablage (Kategorie beleg).
- **Wiederkehrende Ausgaben** (monatlich/jährlich): Der Button „Wiederkehrende buchen“ legt für den gewählten Monat Kopien an.
  - Vorlage ist jeweils die jüngste Buchung je Kombination aus Anbieter, Beschreibung und Intervall.
  - Jährliche nur im passenden Monat; keine Doppelbuchung bei gleichem Anbieter, Monat und Betrag.
  - Der Tag wird übernommen und auf das Monatsende begrenzt.
- **Offene Auslagen:** privat bezahlt und nicht erstattet. Die Seite zeigt eine Karte mit Summe je Person und dem Button „als erstattet markieren“.
- **Ausgabenseite:**
  - Monats- und Jahresfilter, Tabelle mit Beleg-Symbol bzw. dem Hinweis „Beleg fehlt“.
  - Karten „Nach Kategorie“ und „Offene Auslagen“.

### 8.9 Finanzen (Einnahmen-Überschuss-Rechnung einer GbR)

- **Grundsatz Zufluss/Abfluss:**
  - Einnahmen zählen am **Zahlungsdatum** (Tabelle payments).
  - USt-Anteil einer Zahlung = Betrag × (USt / Brutto der Rechnung), aufgeteilt auf die Steuersätze anteilig nach den Positionen.
  - Ausgaben zählen am Ausgabedatum.
- **Monatsübersicht:** Einnahmen netto, Ausgaben netto, Gewinn, USt, Vorsteuer – je Monat.
- **Umsatzsteuer:**
  - Ist-Versteuerung nimmt die Zahlungen; Soll-Versteuerung nimmt die festgeschriebenen Rechnungen nach Rechnungsdatum.
  - Ansicht je Quartal oder Monat: Bemessungsgrundlage 19 %, 7 %, 0 %, USt, Vorsteuer, Zahllast.
- **EÜR:** Einnahmen netto, vereinnahmte USt, Ausgaben je Kategorie, Vorsteuer, Gewinn.
- **Gewinnverteilung:** Gewinn × Anteil / Summe der Anteile, je Gesellschafter.
- **Deckungsbeitrag je Kunde:** bezahlter Umsatz netto minus zugeordnete Ausgaben, Marge in %.
- **Offene Posten:** offen und teilbezahlt, mit Tagen der Überfälligkeit.

### 8.10 Performance

- **Zeiträume:** 30 Tage, 90 Tage (Standard), 6 Monate (182 Tage), 12 Monate. Die Vorperiode ist gleich lang und liegt direkt davor.
- **Beitrags-Summen:**
  - Aufrufe, Reichweite, Likes, Kommentare, Shares, Saves.
  - Interaktionen = Likes + Kommentare + Shares + Saves.
  - Engagement-Rate = Interaktionen / Aufrufe in %.
  - Ø Aufrufe je Beitrag.
- **„Viral“:** Ein Beitrag gilt als viral bei Aufrufen ≥ max(3 × Ø Aufrufe, 1000). Er bekommt dann das Badge „🔥 viral“.
- **Aufrufe pro Monat:** letzte 12 Monate, je Plattform gestapelt (Summe der Beiträge, die im Monat veröffentlicht wurden).
- **Follower-Verlauf:** je Plattform (instagram, tiktok, facebook, youtube) als Linien.
- **Google-Profil:** pro Monat Website-Klicks, Anrufe, Routen, Aufrufe. Dazu Sterne und Bewertungsanzahl je Monat.
- **Werbung:** Ausgaben, Impressionen, Klicks, Reichweite, Conversions, Conversion-Wert.
  - CTR = Klicks / Impressionen
  - CPC = Ausgaben / Klicks
  - CPM = Ausgaben / Impressionen × 1000
  - CPA = Ausgaben / Conversions
  - ROAS = Conversion-Wert / Ausgaben
- **Kompaktübersicht** (`getCustomerSnapshot`):
  - Kacheln: Follower Instagram/TikTok/Facebook, Google-Sterne, Google-Bewertungen, Video-Aufrufe (30 T.), Klicks über Google (30 T.), Tracking-Link-Klicks (30 T.), Klicks aus Anzeigen (30 T.).
  - Jede Kachel mit Vergleich „vs. vor 30 Tagen“ und gegebenenfalls „seit Start“ (Ausgangswert).
- **Vorher → Nachher** (`getBeforeAfter`): Für jeden erfassten Ausgangswert wird verglichen mit:
  - bei Bestandswerten: dem heutigen Wert
  - bei Zeitraumwerten: dem Ø der letzten 3 vollen Monate
  - Anzeige mit Pfeil und Veränderung in %.

### 8.11 Kalender – `getCalendarItems(from, to, {deadlines, userId, customerId})`

- **Echte Termine:** Wenn `userId` gesetzt ist, nur Termine ohne Zuständige oder mit dieser Person.
- **Zusätzlich abgeleitete Einträge** (wenn `deadlines` aktiv):
  - „Dreh: <Content>“ am `shoot_date`
  - Veröffentlichungstermine des Contents
  - „Zahlung fällig: RE-…“ (offen/teilbezahlt)
  - „Angebot läuft ab: AN-…“ (versendet)
  - „Kündigungsfrist: <Vertrag>“ und „Vertragsende: <Vertrag>“
  - „Aufgabe: …“ (offen, mit Datum)
- Jeder Eintrag verlinkt auf seine Quelle und trägt Kunde und Kundenfarbe.

### 8.12 Badges in der Seitenleiste

| Menüpunkt | Zahl |
|---|---|
| Rechnungen | überfällige Rechnungen |
| Aufgaben | meine bzw. nicht zugewiesene offene Aufgaben, fällig ≤ heute |
| E-Mail | ungelesene eingegangene Mails |
| Verträge | Kündigungsfristen in den nächsten 30 Tagen |
| Kunden | neue Website-Leads der letzten 7 Tage |

### 8.13 Tägliche Routine – `GET /api/cron/daily`

- **Schutz:** `Authorization: Bearer CRON_SECRET` oder `?key=`; sonst 401. `maxDuration` 300.
- **Schritte:**
  1. Alle Anbindungen synchronisieren (letzte 3 Tage).
  2. Serienrechnungen vorbereiten.
  3. Versendete Angebote nach `valid_until` auf abgelaufen setzen.
  4. Postfach abrufen.
- **Rückgabe:** JSON mit dem Ergebnis jedes Schritts.

## 9. Oberfläche

### 9.1 Rahmen (AppShell)

**Seitenleiste**
- 256 px breit, immer dunkel (`--sidebar`).
- Oben das Logo: RM-Bildmarke in Messing, daneben „ROTHER **MARKETING**“ in Großbuchstaben (13 px, 0.08em Laufweite), darunter „COCKPIT“ (10 px, 0.22em, gedämpft).
- Navigation in Gruppen mit kleinen Gruppen-Überschriften:
  - Dashboard
  - **Kunden:** Kunden, Verträge
  - **Produktion:** Content, Kalender, Aufgaben
  - **Performance:** Performance, Tracking-Links
  - **Finanzen:** Angebote, Rechnungen, Ausgaben, Auswertung (`/finanzen`)
  - **Büro:** Ablage, E-Mail
- Aktiver Eintrag mit Messing-Akzent; Badges rechts.
- Auf dem Handy als Off-Canvas mit dunklem Overlay; der Hamburger-Button sitzt im Header.

**Header**
- Klebt oben, 64 px hoch, Hintergrund `bg/85` mit Blur.
- Suchfeld mit dem Hinweis „⌘K“.
- Button „+ Neu“ (QuickCreate-Dropdown): Kunde, Content / Video, Termin, Aufgabe, Angebot, Rechnung, Ausgabe / Beleg.
- Benutzermenü:
  - Name und Avatar.
  - Theme-Umschalter Hell/Dunkel/System; gespeichert in `localStorage`. Ein Inline-Skript im `<head>` setzt die Klasse vor dem ersten Rendern, damit nichts flackert.
  - Einstellungen, Abmelden.

**Inhalt**
- Maximal 1400 px breit; Abstände `px-4 sm:px-6 lg:px-8`.

**Befehlspalette** (Ctrl/⌘ + K)
- Sucht über `/api/search?q=` in Kunden, Kontakten, Rechnungen, Angeboten, Verträgen, Content, Dateien und Aufgaben.
- Treffer gruppiert, Bedienung mit Pfeiltasten und Enter; Esc schließt.

**UI-Bausteine**
- Card, CardHeader (Titel, Beschreibung, Icon, Aktionen), CardBody
- Stat (Label, Wert, Veränderung in % grün/rot, `invert` für Kosten, Hinweis, Icon)
- Badge, StatusBadge, Button/LinkButton (primary, secondary, ghost, danger; Größen sm, md, icon)
- Modal (öffnet über einen Trigger, optional `defaultOpen`; schließt mit Esc)
- Tabs (Links mit Zähler), Segmented (Umschalter als Links), Dropdown
- EmptyState (Icon, Titel, Text, Aktion), PageHeader (Zurück-Link, Titel, Meta-Zeile, Aktionen)
- Progress (mehrere farbige Segmente), CopyField (Kopieren-Button), Toast, PrintButton
- Avatar (runde Initialen in Benutzerfarbe), CustomerMark (abgerundetes Quadrat mit Initialen in Kundenfarbe)

**Filter**
- Filter, Tabs und Zeiträume stehen immer in der URL (`?tab=`, `?filter=`, `?zeitraum=`, `?monat=`). Seiten sind dadurch verlinkbar.
- `?neu=1` öffnet das passende „Neu“-Modal direkt.
- `&kunde=ID` belegt den Kunden vor.

### 9.2 Dashboard `/`

- **Kopf:**
  - Kleine Zeile „{Wochentag}, {1. Oktober 2026}“.
  - Darunter die Begrüßung in Serifenschrift, 38–44 px: „{Gruß}, {Vorname}.“ Der Gruß hängt von der Stunde in Berlin ab: vor 11 Uhr „Guten Morgen“, vor 18 Uhr „Hallo“, sonst „Guten Abend“.
  - Untertitel: „Diesen Monat sind noch X Videos offen · Y Termine in den nächsten 7 Tagen · Z überfällige Rechnungen.“
- **4 Kennzahlen:**
  - Einnahmen <Monat> (netto), mit dem Vormonat als Hinweis
  - Offene Forderungen (mit Anzahl und davon überfällig)
  - Monatlich wiederkehrend (MRR, Anzahl aktiver Verträge)
  - Aktive Kunden
- **Linke Spalte (2/3):**
  - **„Content-Soll <Monat>“:**
    - Bis zu 8 Kunden. Jede Zeile: Kundenmarke + Name, Fortschrittsbalken (grün = geliefert, amber = in Arbeit), darunter „3/4 Videos · 2/4 Posts · 1/2 Termine“.
    - Rechts der Status: „✓ erledigt“ (grün), „X ungeplant“ (rot), „X in Arbeit“ (amber) oder „Termine offen“.
    - Jede Zeile verlinkt auf `/content?kunde=ID`. Dazu eine Legende und der Button „Zum Board“.
    - Ohne Verträge erscheint ein erklärender Leerzustand.
  - **„Einnahmen der letzten 12 Monate“:** Säulendiagramm, netto, nach Zahlungseingang.
  - **„Zuletzt passiert“:** die letzten 8 Verlaufseinträge, mit Kunde und Person.
- **Rechte Spalte:**
  - **„Braucht Aufmerksamkeit“** (höchstens 10 Hinweise; auf kleinen Bildschirmen über dem Raster). Reihenfolge und Farben:
    1. Neue Website-Anfragen der letzten 3 Tage, deren Rückmelde-Aufgabe noch offen ist; je Kunde nur einmal (rot).
    2. Überfällige Rechnungen: „RE-… von X ist seit N Tagen überfällig (Betrag)“ (rot).
    3. Kündigungsfristen in den nächsten 30 Tagen: „… – Verlängerung ansprechen“ (amber).
    4. Rechnungsentwürfe, die auf Prüfung warten (blau).
    5. Angebote, die seit mehr als 10 Tagen versendet sind, ohne Antwort: „nachhaken?“ (blau).
    6. Ab der Monatsmitte fehlende Vor-Ort-Termine je Kunde (amber; Link öffnet „Neuer Termin“ mit dem Kunden).
    7. Gestörte Anbindungen (amber).
    8. Ausgaben seit Anfang des Vormonats ohne Beleg: „kurz abfotografieren“ (blau).
    9. Ungelesene Mails (blau).
  - **„Die nächsten 7 Tage“:** gruppiert nach Heute / Morgen / Wochentag; farbige Einträge mit Uhrzeit.
  - **„Meine Aufgaben“:** bis zu 7 Aufgaben, die mir oder niemandem zugewiesen sind und in ≤ 7 Tagen oder ohne Datum fällig sind. Abhaken per Checkbox (optimistisch); überfällige in Rot.
  - **„Top-Beitrag der letzten 30 Tage“:** Plattform-Icon, Text, Kunde, Datum, Aufrufe groß, Link.

### 9.3 Kunden `/kunden`

- **Kopfzeile:** Titel „Kunden“, Untertitel „Euer Kundenkatalog – klick auf einen Kunden für alle Details, Zahlen und Dokumente.“
- **Filter:** Status als Segmented mit Zählern (Interessent, Aktiv, Pausiert, Ehemalig, Alle; Standard Aktiv) und eine Suche nach Name, Ort, Branche.
- **Tabelle** (Zeile klickbar):
  - Kunde (Kundenmarke, Name, darunter Branche · Ort), Status, Vertrag
  - Monatlich (MRR), Content <aktueller Monat> (Fortschrittsbalken), Offene Posten
  - Betreuung (zuständige Person), Kunde seit
- **Neuer Kunde** `/kunden/neu`:
  - Formular: Stammdaten, Kanäle (Instagram-/TikTok-Handle, Facebook, YouTube, Google-Profil-URL, Google Place ID), Zahlungsziel, Farbe, zuständige Person, Start, Quelle, Notizen.
  - Die Nummer wird automatisch vergeben, `report_token` zufällig erzeugt.

### 9.4 Kundenakte `/kunden/[id]` – das Herzstück

**Kopf**
- Kundenmarke groß und Name.
- Meta-Zeile: Status-Badge, Nummer, Branche, Ort, Badge „Demo“ falls Demo.
- Aktionen: E-Mail, Anrufen (`tel:`), Content, Termin, Angebot, Rechnung (primär).
- Darunter Chips mit den Kanälen (Website, @instagram, @tiktok, Facebook, YouTube, Google-Profil); öffnen jeweils in einem neuen Tab.

**Tabs** (mit Zählern):

1. **Übersicht**
   - Kompaktübersicht (Kennzahl-Kacheln mit Vergleich), sonst der Leerzustand „Noch keine Performance-Zahlen“.
   - „Soll & Ist im <Monat>“ mit Balken für Videos, Posts und Termine.
   - Verlauf mit Notizfeld (Art: Notiz, Telefonat, Meeting, E-Mail).
   - Ansprechpartner: hinzufügen und bearbeiten, primär markieren.
   - „Vertrag & Konditionen“: Gebühr, Umfang, Laufzeit, Kündigungsfrist, Bedingungen.
   - Nächste Termine, offene Aufgaben.
2. **Performance**
   - Zeitraum-Umschalter, dazu das Performance-Dashboard (siehe 11).
   - Buttons „Kennzahlen eintragen“ (Konto-Kennzahlen für ein Datum) und „+ Beitrag“ (manuell: Plattform, URL, Text, Datum, Aufrufe, Reichweite, Likes, Kommentare, Shares, Saves).
   - Tabelle „Alle Beiträge“ (die letzten 50, mit Stift-Symbol zum Bearbeiten).
3. **Content**
   - Diagramm „Lieferung der letzten 6 Monate“: fertige Videos im Vergleich zum Soll.
   - Liste aller Content-Karten des Kunden.
4. **Werbung**
   - Kennzahlen: Ausgaben (mit Budget/Monat), Impressionen, Klicks, CTR, Kosten pro Klick (invertiert), Leads/Conversions (mit Kosten je Lead).
   - Diagramme „Ausgaben pro Tag“ und „Klicks pro Tag“.
   - Kampagnen-Tabelle mit Werten im Zeitraum.
   - Kampagne anlegen bzw. bearbeiten, „Zahlen“ manuell erfassen (Datum, Ausgaben, Impressionen, Reichweite, Klicks, Conversions, Wert), löschen.
5. **Verträge**
   - Karten je Vertrag:
     - Status, Gebühr, Intervall, Umfang (Videos/Posts/Besuche pro Monat, Werbebudget), Leistungen
     - Laufzeit-Label, Laufzeitende, Kündigungsdeadline („noch X Tage“, in Farbe), Bedingungen
   - Aktionen:
     - Bearbeiten.
     - „Kündigung erfassen“: Vertragsende (vorbelegt mit dem Laufzeitende) und Grund → Status gekündigt, `cancelled_at` = heute, Verlaufseintrag „Endet zum …“.
     - Löschen.
   - Das Vertragsformular enthält auch automatische Abrechnung und nächsten Rechnungstermin.
6. **Finanzen**
   - Kennzahlen: Umsatz gesamt netto (seit Start), Deckungsbeitrag mit Marge, offene Posten (bei Rest hervorgehoben).
   - Tabellen: Rechnungen, Angebote, zugeordnete Kosten.
7. **Dateien**
   - Ablage gefiltert auf den Kunden, mit Upload.
8. **Verlauf & Mails**
   - Kompletter Verlauf und alle Mails des Kunden.
   - Website-Anfragen erscheinen hier als Eintrag „Anfrage über die Website“.
9. **Anbindungen & Report**
   - **„Kanäle verbinden“:** je Anbieter eine Karte mit Beschreibung und Voraussetzungen.
     - Nicht verbunden: Button „Verbinden“ (OAuth).
     - Verbunden: Konto, letzter Sync, Fehler, „Jetzt synchronisieren“, „Trennen“.
     - Muss noch ein Konto gewählt werden (Facebook-Seite, Werbekonto, Standort): Auswahlformular.
     - Ohne hinterlegte App-Zugangsdaten: Hinweis auf die Einstellungen.
     - Rückmeldung über `?verbunden=` bzw. `?fehler=`.
   - **„Kunden-Report“:**
     - Schalter „Report-Link freigeben“, Link mit Kopieren-Button, „Vorschau“ (`?vorschau=1`).
     - „Neuen Link erzeugen“: neuer Token, der alte Link wird ungültig.
     - „Per E-Mail senden“ (Vorlage report).
   - **„Ausgangswerte (Vorher)“:** Formular für jede Kennzahl (Wert + Datum).
   - **„Tracking-Links & NFC-Karten“** des Kunden, mit „+ Link“.
10. **Stammdaten**
    - Kundenformular.
    - „Kunde löschen“ (Angelegt am …). Gesperrt, sobald Rechnungen oder Angebote existieren, mit der Meldung: „Kunden mit Rechnungen oder Angeboten können aus Gründen der Aufbewahrungspflicht nicht gelöscht werden. Setze den Status stattdessen auf „Ehemalig“.“

### 9.5 Verträge `/vertraege`

- Untertitel: „Alle Kundenverträge mit Laufzeiten, Kündigungsfristen und Konditionen. Neue Verträge legt ihr direkt beim Kunden an.“
- Kennzahl „Monatlich wiederkehrend (MRR)“ mit Hinweis „<MRR × 12> pro Jahr“.
- Filter: „Laufend“ (Standard) und „Alle inkl. beendet“.
- Tabelle: Kunde / Paket, Status, Monatlich, Umfang, Laufzeit bis, Kündbar bis (rot/amber bei < 30 Tagen), Frist.

### 9.6 Content `/content`

- **Kopfzeile:** Titel „Content-Produktion“, Untertitel „Von der Idee bis zum veröffentlichten Video – und was jedem Kunden diesen Monat noch fehlt.“ Dazu Monatsauswahl (vor/zurück) und Kundenfilter.
- **Karte „Soll im <Monat>“:**
  - Je Kunde eine Zeile mit Videos, Posts und Terminen.
  - Button „Fehlende Videos als Karten anlegen“ (`fillQuota`): legt höchstens 20 Karten „Video N – Kunde“ an, Format reel, Plattformen Instagram + TikTok, Status geplant.
- **Kanban-Board:**
  - 7 Spalten = Content-Status; Karten per **Drag & Drop** verschiebbar (HTML5 DnD, `useOptimistic`). Auf dem Handy horizontal scrollbar; der Status lässt sich außerdem im Bearbeiten-Formular ändern.
  - Karte zeigt: Kundenfarbe/-name, Titel, Format, Plattform-Icons, zuständige Person, Drehdatum, Fälligkeit (überfällig in Rot), geplantes bzw. erfolgtes Veröffentlichungsdatum, „✓ Kunde hat freigegeben“.
- **Auf „Veröffentlicht“ verschieben:**
  - `publish_date` = heute, falls leer.
  - Verlaufseintrag „Veröffentlicht: …“.
  - Gibt es eine `published_url`, wird automatisch ein Beitrag (`posts`, manuell) angelegt; die Plattform wird aus der URL erkannt.
- **Content-Formular:** Kunde, Titel, Format, Plattformen (Mehrfachauswahl), Status, Monat, zuständige Person, Drehtag, Fällig, Veröffentlichung, Konzept/Skript, Notizen, veröffentlichter Link, Kundenfreigabe.

### 9.7 Kalender `/kalender`

- **Ansichten:** Monat (Standard), Woche (Stundenraster), Agenda. Navigation zurück, heute, vor.
- **Umschalter:** „Alle / Nur meine“ und „Mit Fristen / Nur Termine“; dazu ein Kundenfilter.
- **Darstellung:** Einträge farbig nach Typ (linker Rand + zarter Hintergrund); Fristen gestrichelt bzw. dezenter.
- **Termin anlegen:** Klick auf einen Tag. Formular:
  - Titel, Typ, ganztägig, Start, Ende, Ort, Kunde
  - Zuständige (Mehrfachauswahl Team)
  - „Zählt als Vor-Ort-Besuch“, Notizen
- **Abonnieren:** Modal mit dem persönlichen ICS-Link, Kopieren-Button und Anleitung für Google, Apple und Outlook. Hinweis: „Der Link ist persönlich – nicht weitergeben.“ Der Link lässt sich in den Einstellungen neu erzeugen.

### 9.8 Aufgaben `/aufgaben`

- Filter: „Meine“ (Standard: mir oder niemandem zugewiesen), „Alle offenen“, „Erledigt“.
- Gruppen: Überfällig (rot), Heute, Nächste 7 Tage, Später, Ohne Termin.
- Zeile: Checkbox (optimistisch), Titel, Kunde, Priorität, Fälligkeit, zuständige Person; Bearbeiten, Löschen.
- Beim Abhaken wird `completed_at` gesetzt.

### 9.9 Performance `/performance`

- Untertitel: „Wie laufen die Kanäle eurer Kunden? Alle Zahlen auf einen Blick – Details beim jeweiligen Kunden.“
- Zeitraum-Umschalter, Button „Alle synchronisieren“.
- **Kennzahlen:**
  - Aufrufe aller Kunden (Δ, Anzahl Beiträge)
  - Interaktionen
  - Klicks über Tracking-Links
  - Betreutes Werbebudget (Klicks)
- **Tabelle „Kunden im Überblick“** (sortiert nach Aufrufen): Kunde, Aufrufe, vs. davor, Beiträge, Follower, Zuwachs, Google ★, Google-Klicks, Link-Klicks, Anbindung (Icons, Fehler rot).
- **„Top-Beiträge über alle Kunden“** mit dem Badge „🔥 viral“.

### 9.10 Tracking-Links `/links` und `/links/[id]`

- **Liste:** Link (Label + Ziel), Kunde, Kanal, Kurz-Adresse `APP_URL/go/<slug>` (kopierbar), Klicks 30 Tage, Klicks gesamt.
- **Leerzustand** mit Beispiel: „Legt für jede NFC-Bewertungskarte einen Link an, der auf den Google-Bewertungslink des Kunden weiterleitet …“
- **Formular:** Label, Kunde, Kanal, Ziel-URL, Slug (optional, sonst automatisch; nur a–z, 0–9 und Bindestrich, eindeutig).
- **Detailseite:**
  - Aktionen: Bearbeiten, aktiv/inaktiv schalten, Löschen.
  - Klicks 30 Tage (vs. 30 Tage davor), Klicks gesamt, letzter Klick.
  - Flächendiagramm „Klicks pro Tag“ (90 Tage).
  - Geräte (Balken), Herkunft (Domains).
  - QR-Code als PNG (1024 px) und SVG über `/api/links/[id]/qr?format=png|svg&download=1`, Farbe #1E1A17 auf Weiß, Fehlerkorrektur M.
- **Weiterleitung `/go/[slug]`:**
  - Inaktiv oder unbekannt: 404 mit dem Text „Dieser Link ist nicht (mehr) aktiv.“
  - Bots werden nicht gezählt (Regex: bot, crawler, spider, preview, facebookexternalhit, whatsapp, telegram, slack, discord, curl, wget, headless).
  - Sonst wird ein Klick gespeichert: Gerät, Herkunft (nur Domain), Land aus `x-vercel-ip-country`, keine IP. `click_count` wird erhöht.
  - Antwort: 302 mit `Cache-Control: no-store`.

### 9.11 Angebote `/angebote`, Rechnungen `/rechnungen`, Ausgaben `/ausgaben`

- **Angebote:**
  - Filter: Offen (Entwurf + versendet), Angenommen, Abgelehnt, Abgelaufen, Alle.
  - Tabelle: Nummer, Kunde, Titel, Datum, gültig bis, Netto, Status.
- **Rechnungen:**
  - Filter: Offen (Standard), Überfällig, Entwürfe, Bezahlt, Storniert, Alle; dazu ein Jahresfilter.
  - Tabelle: Nummer (bzw. „Entwurf“), Kunde, Titel, Datum, fällig (überfällig rot, „seit N Tagen“), Brutto, offen, Status.
  - Kopf-Buttons „Serienrechnungen“ (bereitet fällige Serienrechnungen aus Verträgen vor) und „Neue Rechnung“.
- **Ausgaben:** siehe 8.8.
- Detailseiten mit Editor (`?bearbeiten=1`) und PDF-Vorschau.

### 9.12 Auswertung `/finanzen`

- Titel „Finanzen & Buchhaltung“, Jahresauswahl.
- **Tabs:**
  1. **Übersicht:**
     - Kennzahlen: Einnahmen netto (vs. Vorjahr), Ausgaben netto, Gewinn (mit Marge), USt-Zahllast im Jahr (bei Kleinunternehmer „§ 19 UStG“, mit Hinweis Ist- bzw. Soll-Versteuerung).
     - Säulen „Einnahmen und Ausgaben pro Monat“ (chart-1 / chart-2), Diagramm „Gewinn pro Monat“.
  2. **EÜR & Gewinnverteilung:**
     - Tabelle der EÜR mit dem Hinweis „Vereinfachte Darstellung nach Zufluss-/Abflussprinzip (netto). Ersetzt nicht die Anlage EÜR – ist aber die perfekte Vorlage dafür.“
     - Karte „Gewinnverteilung GbR“.
  3. **Umsatzsteuer:** Quartal oder Monat; Hinweis auf Ist- bzw. Soll-Versteuerung, bzw. Kleinunternehmer.
  4. **Umsatz je Kunde:** mit Deckungsbeitrag und Marge.
  5. **Offene Posten**.
  6. **Export für Steuerberater:**
     - CSV Einnahmen (`/api/export/einnahmen?jahr=`)
     - CSV Ausgaben (`/api/export/ausgaben?jahr=`)
     - ZIP (`/api/export/belege?jahr=`): Ordner `Rechnungen/` mit den archivierten Rechnungs-PDFs, Ordner `Belege/` mit Dateien `<Datum>_<Anbieter>_Beleg_<id>.<ext>`, dazu eine `LIESMICH.txt`
     - JSON-Komplettsicherung (`/api/export/backup`, `cockpit-sicherung-<Datum>.json`): alle Tabellen, Benutzer nur mit id, Name, E-Mail und Rolle, Einstellungen ohne `oauthApps` und `mail`, ohne Datei-Inhalte und Zugangstokens
     - Zellen, die mit `= + - @` beginnen, bekommen ein `'` davor (Schutz vor Formel-Injektion)
     - CSV mit Semikolon, Dezimalkomma und UTF-8-BOM, damit Excel sie korrekt öffnet.

### 9.13 Ablage `/ablage`

- Untertitel: „Verträge, Angebote, Rechnungen, Belege und alles andere an einem Ort · N Dateien, X MB“.
- **Filter:** Kategorien (mit Zählern) in einer Seitenspalte, Kundenfilter, Suche nach Dateiname oder Notiz.
- **Tabelle:** Dateityp-Icon, Name, Kunde, Kategorie, Größe, Datum, Bearbeiten (Name, Kategorie, Kunde, Notiz), Löschen.
- **Upload:** mehrere Dateien gleichzeitig (`multiple`), mit Kategorie, Kunde und Notiz; höchstens 10 MB je Datei.
- **Anzeige:** `/api/files/[id]` liefert die Datei inline aus, mit `?download=1` als Download.
- **Automatisch abgelegt** werden: festgeschriebene Rechnungen, Storno-Rechnungen, angenommene Angebote, Belege.

### 9.14 E-Mail `/mail` und `/mail/[id]`

- **Kopf:** Untertitel „Postfach: <Adresse>“ bzw. „Noch kein Postfach eingerichtet“.
- **Ordner:** Eingang und Gesendet (Segmented), dazu eine Suche.
- **Aktionen:** „Abrufen“ (IMAP jetzt) und „Neue E-Mail“.
- **Liste:** ungelesene Mails fett, mit Kundenmarke, Betreff, Vorschau, Datum, Anhang-Symbol.
- **Detailseite:**
  - Absender, Empfänger, Datum, Text (HTML bereinigt bzw. Text).
  - Aktionen: Antworten (Modal; Betreff mit „Re:“ und `In-Reply-To`), gelesen/ungelesen, löschen.
  - Kunde zuordnen (Auswahl).
- **Neue E-Mail:** An, CC, Betreff, Text, optional Kunde; dazu Vorlagen und die Signatur.

### 9.15 Einstellungen `/einstellungen`

Tabs:

1. **Profil**
   - Mein Profil (Name, E-Mail, Farbe), Passwort ändern.
   - „Mein Kalender-Abo“: Link mit Kopieren-Button, „neu erzeugen“.
   - Team: Zugang anlegen, aktiv/inaktiv schalten, Passwort setzen.
2. **Firma**
   - Firmendaten (Hinweis „Erscheinen auf Angeboten, Rechnungen, E-Rechnungen und im Kunden-Report“).
   - „Gesellschafter & Gewinnverteilung“ (Namen und Anteile in %).
3. **Rechnungen**
   - Kleinunternehmer, Ist/Soll, Standard-Steuersatz, Zahlungsziel, Gültigkeit von Angeboten, Präfixe.
   - Einleitungs- und Schlusstexte, Mahnfrist, Mahngebühr.
4. **Leistungen**
   - Leistungskatalog (Name, Beschreibung, Kategorie, Einheit, Preis, Steuersatz, aktiv, Reihenfolge).
5. **E-Mail**
   - „Postfach verbinden“ (SMTP + IMAP + Signatur + BCC an mich), Button „Verbindung testen“.
   - Hinweis: „IONOS, Strato, Google Workspace: App-Passwort nutzen“.
   - E-Mail-Vorlagen mit Liste der Platzhalter.
6. **Anbindungen**
   - **„Eigene Entwickler-Apps“:** Client-ID und Secret für TikTok, Instagram, Meta und Google; dazu Google-Ads-Developer-Token, Login-Customer-ID und Google-Places-API-Key.
     - Zu jeder App wird die Redirect-URI `APP_URL/api/oauth/<provider>/callback` angezeigt (kopierbar).
     - Gespeicherte Secrets und Passwörter werden nie zurückgegeben. Das Feld zeigt den Platzhalter „••••••••“ und den Hinweis „gespeichert – leer lassen, um es zu behalten“.
   - **„Website-Anfragen“** (siehe 18):
     - Schlüssel erzeugen (wird **nur einmal** angezeigt).
     - Ziel-URL zum Kopieren.
     - Status: Anzahl der Anfragen, zuletzt empfangen.
   - **„So funktioniert's“:** Kurzanleitung.
   - **„Plattformen“:** Übersicht, welche Plattform welche Daten liefert.
7. **Daten**
   - Datensicherung (JSON-Download).
   - Demo-Daten: Anzahl, „Demo-Daten entfernen“ (löscht alles mit `is_demo` bzw. Demo-Kunden kaskadierend), „Demo-Daten laden“.

## 10. Diagramme (Recharts)

- **Komponenten** in `components/charts/Charts.tsx` (Client):
  - `ColumnChart` (auch gestapelt), `TrendChart` (Linie bzw. Fläche)
  - Optionen: `xFormat` = month|day, `format` = eur|number|rating
- **Gestaltung:**
  - Gitter `--chart-grid`, Achsen `--chart-axis`.
  - Tooltips als Karte im App-Stil, deutsche Zahlenformate.
  - Säulen mit abgerundeten oberen Ecken, keine 3D-Effekte; Legenden nur bei mehreren Serien.
- **Feste Farb-Zuordnung je Plattform:** instagram → chart-2, tiktok → chart-3, facebook → chart-1, youtube → chart-4. Die Farbe folgt der Plattform, nie dem Rang.
- **Palette** (farbfehlsichtigkeits-sicher geprüft):

| Variable | Hell | Dunkel |
|---|---|---|
| chart-1 | #2a78d6 | #3987e5 |
| chart-2 | #eb6834 | #d95926 |
| chart-3 | #1baf7a | #199e70 |
| chart-4 | #eda100 | #c98500 |
| chart-grid | #ece5d9 | #2c2721 |
| chart-axis | #8a8174 | #8f867b |

## 11. Performance-Dashboard (intern und im Kunden-Report identisch)

`PerformanceDashboard({ data, audience: "intern" | "kunde" })` zeigt nacheinander:

1. **Kennzahlen:** Aufrufe (Zeitraum), Interaktionen, Engagement-Rate, veröffentlichte Beiträge – jeweils mit Δ zur Vorperiode.
2. **„Aufrufe pro Monat“:** gestapelt je Plattform, 12 Monate.
3. **„Follower-Entwicklung“:** Linien je Plattform.
4. **Google-Unternehmensprofil:** Website-Klicks, Anrufe, Routen pro Monat. Dazu Sterne und Anzahl der Bewertungen (nur wenn Daten vorhanden).
5. **„Klicks auf Tracking-Links & NFC-Karten“:** pro Tag.
6. **„Werbeanzeigen“:** Kennzahlen (nur wenn Ausgaben vorhanden).
7. **„Vorher → Nachher“:** Ausgangswerte im Vergleich zu heute bzw. zum Ø der letzten 3 Monate. Große Zahlen, Pfeil, „+340 %“ in Grün.
8. **„Top-Beiträge“:** 10 Beiträge, sortiert nach Aufrufen, mit Badge „🔥 viral“.

Abschnitte ohne Daten werden ausgeblendet. Für Kunden gibt es keine Bearbeiten-Knöpfe.

## 12. Kunden-Report `/report/[token]` (öffentlich, ohne Login)

- **Zugang:**
  - 404, wenn der Token unbekannt oder der Report nicht freigegeben ist.
  - Ausnahme `?vorschau=1` für angemeldete Benutzer, mit gelbem Banner: „Vorschau – der Link ist für den Kunden noch nicht freigegeben.“
- **Kopf:** RM-Bildmarke in Messing, Firmenname in Großbuchstaben, Claim in Serifen-Kursiv, Zeitraum-Umschalter, Drucken-Button.
- **Titelbereich:**
  - Kleine Überschrift „MARKETING-REPORT“ in Messing.
  - Kundenname in Serifenschrift, 40 px.
  - „Zeitraum TT.MM.JJJJ – TT.MM.JJJJ · Zusammenarbeit seit …“ und „Stand: …“.
- **„Das haben wir für Sie umgesetzt“:** 4 Kacheln – veröffentlichte Beiträge, Drehs & Termine vor Ort, Aufrufe Ihrer Beiträge, Klicks über Links & NFC.
- **Danach** das Performance-Dashboard (`audience` = kunde).
- **Fußzeile:**
  - „Fragen zu Ihren Zahlen? Wir sind für Sie da: <Telefon> · <E-Mail>“
  - Claim groß in Serifen-Kursiv
  - „Erstellt von … · Alle Zahlen stammen direkt von den Plattformen bzw. aus unserer Auswertung.“
- Druckfreundlich (`.no-print`); `noindex`.

## 13. Plattform-Anbindungen (OAuth, `lib/integrations/*`)

**Anbieter** (Schlüssel, Plattform, App):

| Schlüssel | Plattform | App |
|---|---|---|
| instagram | instagram | instagram |
| tiktok | tiktok | tiktok |
| facebook | facebook | meta |
| meta_ads | meta | meta |
| google_ads | google | google |
| google_business | google | google |

**App-Zugangsdaten**
- Zuerst aus den Einstellungen, sonst aus den Umgebungsvariablen:
  - `TIKTOK_CLIENT_KEY/SECRET`, `INSTAGRAM_APP_ID/SECRET`, `META_APP_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`
  - `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_PLACES_API_KEY`
- Versionen: `META_GRAPH_VERSION` (Default v23.0), `GOOGLE_ADS_API_VERSION` (Default v21).

**Ablauf**
1. `/api/oauth/[provider]/start?kunde=ID`: Ein signierter State-JWT `{ p: provider, c: customerId, u: userId }` (gültig 20 Minuten) wird erzeugt, dann geht es weiter zur Anmeldeseite des Anbieters. Fehlen die App-Zugangsdaten, geht es mit `&fehler=…` zurück zum Kunden.
2. `/api/oauth/[provider]/callback`: State prüfen, Code gegen Tokens tauschen, Tokens verschlüsselt in `integrations` speichern.
   - Gibt es mehrere Konten (Facebook-Seiten, Werbekonten, Google-Ads-Kunden, Google-Standorte), werden sie als `config.choices` abgelegt und im Kunden-Tab ausgewählt.
   - Danach zurück auf `/kunden/ID?tab=anbindungen&verbunden=…` bzw. `&fehler=…`.
   - Nach dem Verbinden wird sofort synchronisiert.

**Details je Anbieter**

- **TikTok**
  - Login: `https://www.tiktok.com/v2/auth/authorize/` mit den Scopes `user.info.basic,user.info.stats,video.list`.
  - Token: `https://open.tiktokapis.com/v2/oauth/token/`; Refresh über den Refresh-Token.
  - Sync: `user/info` (follower_count, likes_count) und `video/list` (Aufrufe, Likes, Kommentare, Shares, Cover, Link).
- **Instagram** (API mit Instagram-Login)
  - Login: `https://www.instagram.com/oauth/authorize` mit den Scopes `instagram_business_basic,instagram_business_manage_insights`.
  - Token: Kurzzeit-Token bei `api.instagram.com/oauth/access_token`, dann Langzeit-Token per `graph.instagram.com/access_token?grant_type=ig_exchange_token`. Erneuern per `refresh_access_token`, wenn er in weniger als 7 Tagen abläuft.
  - Sync: `me` (followers_count), `me/insights` reach (Tageswerte) und `me/media` (50 Beiträge) mit Insights `views,reach,saved,shares`, dazu like_count und comments_count.
- **Facebook-Seite**
  - Login: Facebook-OAuth-Dialog mit den Scopes `pages_show_list,pages_read_engagement,read_insights`.
  - Langzeit-User-Token; Seite wählen; dann wird der Seiten-Token (läuft nicht ab) gespeichert.
  - Sync: followers_count bzw. fan_count und Beiträge (Reaktionen, Kommentare, Shares, `post_impressions_unique`).
- **Meta Ads**
  - Scopes `ads_read,business_management`; Werbekonto wählen.
  - Sync: `insights` auf Kampagnenebene, tageweise: Ausgaben, Impressionen, Reichweite, Klicks.
  - Conversions = Summe der `actions` vom Typ lead, purchase, complete_registration, contact, onsite_conversion.lead_grouped und onsite_conversion.messaging_conversation_started_7d.
  - Conversion-Wert aus `action_values` vom Typ purchase.
- **Google Ads**
  - Scope `https://www.googleapis.com/auth/adwords`; `access_type=offline`, `prompt=consent`.
  - Konto aus `customers:listAccessibleCustomers` wählen.
  - Sync per GAQL über `googleAds:search`:
    `SELECT campaign.id, campaign.name, campaign.status, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN …`
  - Umrechnung: Kosten = `cost_micros / 10 000` (in Cent).
  - Header: `developer-token`, optional `login-customer-id`.
- **Google-Unternehmensprofil**
  - Scope `business.manage`; Standort wählen (Account Management API + Business Information API).
  - Sync über `fetchMultiDailyMetricsTimeSeries` mit dieser Zuordnung:

| Google-Metrik | Feld im Cockpit |
|---|---|
| WEBSITE_CLICKS | website_clicks |
| CALL_CLICKS | call_clicks |
| BUSINESS_DIRECTION_REQUESTS | direction_requests |
| BUSINESS_IMPRESSIONS_DESKTOP_MAPS, _DESKTOP_SEARCH, _MOBILE_MAPS, _MOBILE_SEARCH (summiert) | impressions |

  - Dazu Sterne und Anzahl der Bewertungen aus der v4-Reviews-API.
- **Ohne Login:** Google Places API (New) `places/{placeId}` mit `X-Goog-FieldMask: rating,userRatingCount` liefert Sterne und Anzahl, sobald beim Kunden eine `google_place_id` hinterlegt ist.

**Synchronisierung allgemein**
- **Speichern:** Upserts in `metrics_daily`, `posts` (über platform + external_id) und `ad_campaigns` / `ad_stats_daily`. Zusätzlich je Beitrag ein Tages-Snapshot in `post_snapshots`.
- **Fehler:** Die Anbindung bekommt den Status „fehler“ und `last_error`; das Dashboard zeigt einen Hinweis. Ein Fehler bei einem Anbieter stoppt nicht die übrigen.
- **HTTP-Helfer:** `getJson` mit `cache: "no-store"`, 25 s Timeout und verständlichen Fehlermeldungen „<Status>: <Meldung des Anbieters>“ (Klasse `ApiError`). Dazu `form()` für URL-Parameter.
- **Ohne API:** Alles lässt sich auch **manuell** pflegen (Beiträge, Kennzahlen, Kampagnen-Zahlen). Die Software funktioniert vollständig ohne eine einzige API.

## 14. E-Mail (`lib/mail.ts`, `lib/inbox.ts`)

- **Versand** mit nodemailer:
  - Konfiguration aus den Einstellungen bzw. den Umgebungsvariablen.
  - Signatur wird angehängt, optional BCC an mich.
  - Jede Mail wird in `emails` gespeichert (gesendet bzw. fehler mit Fehlermeldung), mit Kunde und Bezug.
  - Ohne SMTP gibt es eine klare Fehlermeldung.
- **Empfang** mit imapflow + mailparser:
  - INBOX der letzten 14 Tage, Duplikate über `message_id` vermeiden, neu eingehende als ungelesen markieren.
  - **Kunden-Zuordnung:** exakte Adresse (Kunde oder Kontakt), sonst gleiche Firmen-Domain (aus E-Mail oder Website des Kunden). Freemail-Domains zählen nicht (gmail, gmx, web, t-online, outlook, hotmail, yahoo, icloud, live, aol, freenet, posteo, mail …).
- **„Verbindung testen“:** prüft SMTP (`verify`) und IMAP (Login) und meldet das Ergebnis per Toast.

## 15. PDFs und E-Rechnung

**PDF** (`lib/pdf/document.tsx`, @react-pdf/renderer, A4, angelehnt an DIN 5008)
- **Ränder:** oben 18 mm, unten 32 mm, links 25 mm, rechts 20 mm. Schrift Helvetica 9,5 pt, Farbe #1E1A17, Zeilenhöhe 1,4.
- **Kopf rechts:**
  - RM-Bildmarke als Svg/Path in der Akzentfarbe (30×17 pt).
  - Firmenname in Großbuchstaben, fett, 10,5 pt, Laufweite 1,2.
  - Darunter der Claim in Times-Italic in der Akzentfarbe.
- **Absenderzeile:** bei 45 mm, 7 pt, unterstrichen.
- **Anschriftfeld:** bei 51 mm, 85 mm breit; Kunde fett, Ansprechpartner, Adresse.
- **Infoblock rechts:**
  - Angebots- bzw. Rechnungsnummer, Datum, Kundennummer
  - Leistungszeitraum (oder „Leistungsdatum: entspricht Rechnungsdatum“)
  - Gültig bis bzw. Zahlbar bis, „Storno zu“/„Bezug“, USt-IdNr. des Kunden
- **Titel und Einleitung:**
  - Titel in Times-Roman 19 pt: „Angebot AN-…“, „Rechnung RE-…“ oder „Stornorechnung RE-…“.
  - Betreff fett.
  - Anrede: „Hallo <Ansprechpartner>,“ bzw. „Sehr geehrte Damen und Herren,“.
  - Einleitungstext; der Platzhalter `{{faellig}}`/`{{gueltig_bis}}` wird ersetzt.
- **Positionstabelle:**
  - Spalten: Pos., Beschreibung (Titel + graue Beschreibung), Menge, Einheit, Einzelpreis, Gesamt.
  - Kopfzeile mit einer Linie in der Akzentfarbe.
  - Optionale Positionen mit „(optional)“ und nicht in der Summe.
- **Summen:** Zwischensumme, Rabatt, Summe netto, „zzgl. 19 % USt. auf …“ je Satz, dann **Gesamtbetrag** bzw. **Angebotssumme** fett mit Linie in der Akzentfarbe.
- **Pflichttexte:**
  - Bei Kleinunternehmer: „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“
  - Bei Storno: „Diese Stornorechnung hebt die Rechnung … vollständig auf.“
- **Schluss:** Schlusstext, „Mit freundlichen Grüßen“, die Gesellschafter.
- **Fußzeile** (jede Seite, 7 pt, 4 Spalten):
  1. Firma + Rechtsform, Adresse
  2. Gesellschafter, Telefon, E-Mail
  3. Steuernummer, USt-IdNr.
  4. Bank, IBAN, BIC
- Seitenzahl „Seite x von y“ (nur bei mehr als einer Seite).
- Entwürfe tragen „ENTWURF“ diagonal, groß, in Akzentfarbe mit 8 % Deckkraft.

**Routen**
- `/api/invoices/[id]/pdf` (archiviertes PDF bevorzugt), `/api/quotes/[id]/pdf`.
- Mit `?download=1` als Download; Dateiname „Rechnung RE-… – Kunde.pdf“.

**XRechnung 3.0** (UN/CEFACT CII, `lib/pdf/xrechnung.ts`)
- Guideline `urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0`.
- TypeCode 380, bei Storno 381.
- BuyerReference = Kundennummer.
- Verkäufer: Adresse, Kontakt, E-Mail, USt-IdNr. (`VA`) bzw. Steuernummer (`FC`).
- Käufer: Adresse, E-Mail.
- Leistungszeitraum.
- Zahlungsart 58 (SEPA-Überweisung) mit IBAN.
- Steuern je Satz, Kategorie `S` bzw. `E` mit dem Befreiungsgrund „Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß § 19 UStG“.
- Einheiten-Codes:

| Einheit | Code |
|---|---|
| Stück | H87 |
| Stunde | HUR |
| Tag | DAY |
| Monat | MON |
| km | KMT |
| sonst | C62 |

- Bereits gezahlte Beträge als TotalPrepaidAmount, Zahlungsziel.
- Fehlen Pflichtangaben (z. B. IBAN), zeigt die Software eine verständliche Warnung.
- Route: `/api/invoices/[id]/xml`.

## 16. Ablage

- Dateien liegen als BLOB in `file_blobs`. Das funktioniert lokal und mit Turso ohne zusätzlichen Speicherdienst.
- `files` enthält die Metadaten.
- Funktionen: `saveFile`, `saveUpload` (höchstens 10 MB, sonst „Datei ist größer als 10 MB.“), `readFile`, `deleteFile`.

## 17. Kalender-Abo (ICS) `/api/calendar/[token].ics`

- Persönlicher Link je Benutzer über `calendar_token`.
- Inhalt: Einträge von 60 Tagen zurück bis 365 Tage voraus, inklusive Fristen, gefiltert auf die Person.
- Format:
  - VCALENDAR mit PRODID `-//<Firma> Cockpit//DE` und `X-WR-CALNAME` „<Firma> Cockpit“.
  - VTIMEZONE Europe/Berlin; Termine mit `TZID`, ganztägige als `VALUE=DATE`.
  - Escaping und Zeilenumbruch nach 75 Byte gemäß RFC 5545.
  - Zeilenende CRLF.

## 18. Website-Anbindung (Kontaktformular → Cockpit)

**Im Cockpit: `POST /api/website/anfrage` (öffentlich, aber mit Schlüssel)**
- **Schlüssel:** aus den Einstellungen (verschlüsselt) oder ersatzweise aus der Umgebungsvariable `WEBSITE_SCHLUESSEL`.
  - Ohne Schlüssel: 503 `{ok:false, fehler:"Website-Anbindung im Cockpit nicht eingerichtet"}`.
- **Prüfung:** Header `Authorization: Bearer <schluessel>`. Vergleich zeitkonstant, über die sha256-Werte beider Seiten mit `timingSafeEqual`. Falsch: 401.
- **Weitere Fehler:**
  - Body größer als 20 000 Zeichen: 413
  - kein gültiges JSON: 400
  - zod-Fehler: 422 mit der Liste der Felder
- **Payload** (zod):
  - betrieb (1–120, Pflicht), branche (≤ 80), interessen (string[] ≤ 12)
  - weg „telefon“|„email“ (Pflicht)
  - name (≤ 80), telefon (≤ 40), email (gültig oder leer; wird kleingeschrieben)
  - wunschtermin (≤ 80), nachricht (≤ 2000), seite (≤ 300)
  - Leere Strings werden zu `undefined`.
- **Verarbeitung:**
  1. **Vorhandenen Kunden suchen:** gleiche E-Mail bei einem Kontakt oder Kunden (ohne Groß-/Kleinschreibung), sonst gleicher Firmenname.
  2. **Neu anlegen**, falls nicht gefunden: Interessent (`status lead`) mit nächster Nummer, Branche, E-Mail, Telefon, `source` „Website-Kontaktformular“, Farbe reihum, `report_token`, Notiz „Interessiert an: …“.
  3. **Ansprechpartner** anlegen, falls noch nicht mit dieser E-Mail vorhanden. Er wird primär, wenn es der erste ist; Notiz „Über das Kontaktformular der Website“.
  4. **Verlaufseintrag** kind „anfrage“, Titel „Anfrage über die Website“, Text mit diesen Zeilen:
     - „Rückmeldung gewünscht per Telefon/E-Mail“
     - Name, Telefon, E-Mail, Branche, Interessen, Wunschtermin
     - Leerzeile, dann die Nachricht
  5. **Aufgabe** „Rückmeldung an <Name bzw. Betrieb> per Telefon/E-Mail (<Kontakt>)“: Priorität hoch, niemandem zugewiesen, fällig am **nächsten Werktag** (Mo–Fr), Beschreibung = Nachricht.
  6. **Zähler** `website.received` erhöhen und `lastReceivedAt` setzen.
- **Antwort:** `{ ok: true, kundeId, neu }`, immer mit `Cache-Control: no-store`.
- **Doppelte Anfragen:** Eine zweite Anfrage derselben Person legt keinen zweiten Kunden an, sondern nur einen weiteren Verlaufseintrag und eine weitere Aufgabe. Das Dashboard zeigt pro Kunde nur einen Hinweis.

**Auf der Website** (Next.js-Projekt `rother-marketing-website`; nur falls du Zugriff darauf hast)
- **Modul `lib/cockpit-uebergabe.ts`:**
  - Rein, ohne Server-Importe, damit es testbar ist.
  - `cockpitKonfiguration(env)`: liest `COCKPIT_URL` (ohne Schrägstrich am Ende, muss mit http(s) beginnen) und `COCKPIT_SCHLUESSEL`. Ergebnis: Ziel `…/api/website/anfrage`, oder `null`.
  - `cockpitNutzlast(daten, namen, seite)`: wandelt die Interessen-IDs in lesbare Leistungsnamen um. Spamschutz-Felder bleiben auf der Website.
  - `uebergebeAnsCockpit(...)`: POST mit Bearer-Schlüssel, Timeout 8 s. Ergebnis „uebergeben“ oder „nicht-eingerichtet“; wirft bei einem Fehler.
- **Kontakt-Route:** Mailversand und Übergabe laufen parallel mit `Promise.allSettled`.
  - Erfolg, wenn **mindestens eins** geklappt hat.
  - 502 mit Hinweis auf das Telefon nur, wenn beides scheitert. So geht keine Anfrage verloren.
- **Tests:** Unit-Tests für das Modul (fehlende Variablen, Schrägstrich, falsches Schema, Nutzlast, Header, Fehlerstatus wirft, Timeout).
- **Datenschutzerklärung** um die Übergabe an das interne Kundenverwaltungssystem ergänzen.

## 19. Design-System „Old Money“ (wie die Website: Elfenbein, Espresso, Messing)

**Schriften** (über `next/font/google`, selbst gehostet)
- **Plus Jakarta Sans** als Text (`--ff-text`), Basisgröße 14,5 px.
- **Cormorant Garamond** (500/600/700, normal + kursiv) als Titel (`--ff-titel`, Klasse `font-serif`).
- Seitentitel und große Zahlen-Überschriften in der Serifenschrift.

**Farb-Tokens** (`:root` = hell, `.dark` = dunkel)

| Token | Hell | Dunkel |
|---|---|---|
| --bg | #f8f4ec | #12100d |
| --surface | #ffffff | #1b1814 |
| --surface-2 | #fbf8f2 | #211d18 |
| --surface-3 | #f1eadf | #2a251f |
| --line | #e6ddcf | #322c25 |
| --line-strong | #d6cab7 | #423a31 |
| --fg | #1b1814 | #f3eee4 |
| --fg-2 | #3a332b | #d9d0c2 |
| --muted | #5e574d | #a99f90 |
| --accent | #7a5c33 | #b08d57 |
| --accent-strong | #5f4627 | #c9a774 |
| --accent-soft | #f3ebdc | #2e261b |
| --on-accent | #ffffff | #16130f |
| --sidebar | #16130f | #0c0a08 |
| --sidebar-fg | #f8f4ec | #f3eee4 |
| --sidebar-muted | #b5ab9c | #968c7e |
| --sidebar-active | #231f1a | #1d1915 |
| --sidebar-accent | #b08d57 | #b08d57 |

Dazu `color-scheme` light bzw. dark und die Diagrammfarben aus Abschnitt 10. Alle Tokens werden über `@theme inline` als Tailwind-Farben verfügbar gemacht (`bg-surface`, `text-muted`, `border-line`, `text-accent` …).

**Komponenten-Klassen** in `@layer components`:
- `.input`: rounded-lg, `border-line-strong`, `bg-surface`, Fokus mit Akzent-Ring 20 %.
- `.label`: text-xs, medium, `fg-2`.
- `.card`: rounded-xl, `border-line`, `bg-surface`, `shadow-xs`.
- `.table`: Kopf text-xs `muted`; Zellen px-4 py-3 mit Trennlinie; `tr.row-link` mit Hover `surface-2`.
- `.num`: tabellarische Ziffern.
- `.prose-notes`: Notiztexte mit Zeilenumbrüchen.
- Dazu: `::selection` in Akzentfarbe, `:focus-visible` mit 2-px-Akzent-Outline, Date-Picker-Icon im Dark Mode invertiert, `@media print .no-print`, `prefers-reduced-motion` beachten.

**Logo „RM“** (SVG, `viewBox="0 0 1012 573"`, `fill="currentColor"`):

```
<path d="M0 10H402A187 187 0 0 1 455 374L644 573H484L190 266H402A71 71 0 0 0 402 124H95Z"/>
<path d="M95 268L222 393V573H95Z"/>
<path d="M610 219L695 300L1012 0V572H890V271L695 452L569 326A210 210 0 0 0 610 219Z"/>
```

- **Favicon** `app/icon.svg`: 48×48, `rx` 10, Hintergrund #16130F. Darin die Marke in #B08D57, mit `transform="translate(8 15.5) scale(0.0316)"`.
- **Metadaten:**
  - Titel „Rother Marketing Cockpit“, Template „%s · Rother Marketing Cockpit“.
  - `themeColor` hell #f8f4ec, dunkel #12100d.

**Stil**
- Ruhig und hochwertig: viel Weißraum, dezente Linien statt Schatten, Messing nur als Akzent.
- Status-Badges als zarte, farbige Pillen.
- Icons von lucide in 16 px.
- Plattform-Icons als eigene SVG-Komponente `PlatformIcon` in Markenfarbe.
- Leere Zustände immer mit Erklärung und nächstem Schritt.
- Bestätigung vor allem, was löscht oder festschreibt.
- **Mobil:**
  - Alles funktioniert ab 360 px Breite ohne horizontales Scrollen der Seite.
  - Tabellen scrollen in ihrem eigenen Container.
  - Das Board scrollt horizontal.
  - Modals in den Größen sm/md/lg/xl (max-w-md, max-w-xl, max-w-3xl, max-w-5xl), auf dem Handy volle Breite mit Rand; Inhalt scrollt.

## 20. Demo-Daten (`lib/demo.ts`)

- **Kunden:** 5 Demo-Kunden mit `is_demo`.
  - **Café Lindenblatt** (Café & Bistro):
    - Vertrag „Social Media Paket M“, 1.290 €/Monat, 4 Videos, 4 Posts, 2 Besuche, Mindestlaufzeit 6 Monate, Verlängerung 3, Kündigungsfrist 1 Monat.
    - Bedingung: „Drehs nur vormittags vor 11 Uhr …“.
  - **Autohaus Brenner** (Autohandel & Werkstatt): Vertrag „Meta Ads & Video“, zwei Kontakte.
  - **Zahnarztpraxis Dr. Kaya**: Vertrag „Google-Profil & Rezensionsmanagement“, 490 €, 12 Monate, Kündigungsfrist 3 Monate.
  - **Tischlerei Holtkamp** (Handwerk): Vertrag „TikTok & Recruiting-Videos“, 1.590 €, 6 Videos.
  - **Fitnessstudio Pulsschlag**.
- **Dazu je Kunde:**
  - Kontakte, Ausgangswerte, 6–12 Monate Kennzahlen-Verlauf (Follower wachsend, Google-Klicks), Beiträge mit realistischen Zahlen (einzelne „virale“)
  - Kampagnen mit Tageswerten, Tracking-Links mit Klicks, Content im aktuellen und nächsten Monat in allen Spalten, Termine, Aufgaben
  - Rechnungen der letzten Monate (bezahlt, eine überfällig), Angebote (versendet, angenommen, Entwurf mit optionaler Position), Ausgaben (auch wiederkehrende, eine ohne Beleg)
- **Entfernen:** Alles lässt sich über „Demo-Daten entfernen“ restlos löschen; alles Demo ist markiert.
- **Leistungskatalog:** Die Vorlagen werden immer angelegt.

## 21. Umgebungsvariablen (`.env.example`, deutsch kommentiert)

**Pflicht und Grundlagen**
- `APP_SECRET`: Pflicht, mindestens 32 Zeichen, z. B. `openssl rand -base64 48`.
- `APP_URL`: öffentliche Adresse ohne Schrägstrich am Ende. Fallback `https://$VERCEL_URL`, lokal `http://localhost:3100`.
- `DATABASE_URL` (Default `file:./data/cockpit.db`), `DATABASE_AUTH_TOKEN`.
- `CRON_SECRET`.
- `WEBSITE_SCHLUESSEL` (optional).

**E-Mail**
- `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `IMAP_HOST`, `IMAP_PORT=993`, `IMAP_USER`, `IMAP_PASSWORD`

**Plattformen**
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- `META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_GRAPH_VERSION=v23.0`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_API_VERSION=v21`
- `GOOGLE_PLACES_API_KEY`

## 22. README (`cockpit/README.md`, deutsch)

Die README enthält:
- Funktionsübersicht als Tabelle.
- Schnellstart: `npm install`, `.env` anlegen, `npm run dev` → `/setup`.
- Online-Betrieb mit Vercel und Turso, Schritt für Schritt: Turso-DB anlegen, Variablen setzen, Root-Verzeichnis `cockpit`, Cron.
- Einrichtung jeder Plattform: wo die Entwickler-App angelegt wird, welche Scopes, welche Redirect-URI, App-Review-Hinweise.
- Abschnitt „Website verbinden“.
- Hinweise zu Buchhaltung und GoBD (Festschreiben, Storno, Archiv, die Software ersetzt keinen Steuerberater) und zum Datenschutz (Report-Links, keine IPs, AV-Verträge mit Anbietern).
- Datensicherung.

## 23. Robustheit

- Alle Formulare validieren serverseitig und zeigen Feldfehler an.
- Keine Seite stürzt bei leeren Daten ab; jede hat einen sinnvollen Leerzustand.
- Fehler externer APIs werden abgefangen und verständlich angezeigt; sie blockieren nie die übrige Software.
- Zahlen und Daten durchgehend im deutschen Format.
- Barrierefreiheit: Labels, `aria-label` an Icon-Buttons, Fokus sichtbar, ausreichender Kontrast in beiden Themes.

## 24. Abnahme (selbst durchführen, bevor du fertig meldest)

1. `npm run typecheck`, `npm run lint` und `npm run build` laufen fehlerfrei.
2. Frischer Start mit leerer DB, dann diese Abläufe im Browser:
   1. `/setup` mit Demo-Daten, danach landet man auf dem Dashboard.
   2. Kunde anlegen, Vertrag mit 4 Videos/Monat anlegen: Das Dashboard zeigt „4 ungeplant“. Über „Fehlende Videos als Karten anlegen“ entstehen 4 Karten. Per Drag & Drop auf „Veröffentlicht“ ändert sich der Fortschritt.
   3. Angebot mit optionaler Position erstellen und als PDF ansehen, annehmen (PDF landet in der Ablage), in eine Rechnung umwandeln, festschreiben (Nummer RE-<Jahr>-0001; PDF archiviert). Zahlung teilweise erfassen, dann voll: Status teilbezahlt → bezahlt. Stornieren: Stornorechnung mit negativen Beträgen.
   4. XRechnung-XML herunterladen; die Datei ist gültiges XML.
   5. Ausgabe mit Beleg erfassen. In der Auswertung stimmen EÜR, USt und Gewinnverteilung (50/50).
   6. Tracking-Link anlegen und `/go/<slug>` aufrufen: Der Klick wird gezählt (ein Aufruf mit Bot-User-Agent nicht). QR als PNG und SVG laden.
   7. Kunden-Report freigeben und ohne Login öffnen; ist er gesperrt, kommt 404.
   8. `curl -X POST /api/website/anfrage` mit richtigem Schlüssel legt einen Interessenten, Kontakt, Verlauf und eine Aufgabe für den nächsten Werktag an; das Dashboard zeigt den Hinweis. Mit falschem Schlüssel kommt 401, eine Wiederholung erzeugt keinen zweiten Kunden.
   9. `/api/cron/daily` ohne Secret liefert 401, mit Secret JSON.
   10. Das ICS-Abo lädt und ist gültig.
3. **Playwright-Rundgang** über alle Seiten in Hell, Dunkel und Handybreite (390 px): keine Konsolenfehler, keine Hydration-Warnungen, kein horizontales Scrollen. Schau dir die Screenshots an und behebe optische Fehler.
4. Erst dann fertig melden, mit einer kurzen Liste: was funktioniert und was noch Zugangsdaten braucht (Plattform-Apps, SMTP/IMAP, Turso, Vercel).
