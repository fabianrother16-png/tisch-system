# 📞 HOTLINE HALUNKEN – Das Scam-Callcenter-Partyspiel

> Einer ist das Opfer. Alle anderen rufen an. Und einer davon ist ein Undercover-Cop.

**HOTLINE HALUNKEN** ist ein Multiplayer-Partyspiel für den Browser (3–12 Spieler + beliebig viele Zuschauer), gebaut für
Freundesrunden, Streamer, YouTuber und TikToker. Ihr sitzt zusammen im Voice-Chat (Discord o. Ä.) oder im selben Raum –
das Spiel liefert Rollen, Maschen, Chaos, Sounds, Punkte und die großen Clip-Momente.

![Startseite](docs/home.jpg)

## Die Idee in 20 Sekunden

- 🎯 **Ein Spieler ist das Opfer** – z. B. *Oma Gertrud (84)*, *Graf Dracula* oder *ein smarter Toaster* – mit echtem Konto (1.000 €).
- 😈 **Alle anderen sind Halunken** in der „Halunken GmbH“ und rufen nacheinander an. Jeder wählt eine absurde Masche
  (Winzigweich-Support, Grundstücke auf dem Mond, OmaCoin, Geister-Versicherung …) und bekommt eine **Pflicht-Stimme**
  (Pirat, Sportkommentator, Opernsänger, Roboter …).
- 📱 **Das Opfer steuert live:** Geld überweisen, Vertrauens-O-Meter hoch/runter, Anrufer in die **Warteschleife**
  schicken („Für Elise“ in 8-Bit 🎵) – oder mit dem großen roten Knopf **AUFLEGEN**.
- ⚡ **Chaos-Karten** platzen mitten ins Gespräch: Schluckauf, Rollentausch, „Das Opfer ist jetzt schwerhörig“, Papagei …
- 🚔 **Der Twist:** Einer der Anrufer ist ein **Undercover-Cop**. Er darf nie „Geld“, „Euro“, „zahlen“ oder „überweisen“
  sagen. Bei der **Razzia** stimmen alle ab. Wer richtig tippt, kassiert Bonus – entkommt der Cop, **beschlagnahmt** er
  die Beute des reichsten Halunken.
- 🏆 Am Ende: Podest, **Mitarbeiter des Monats**, Awards („Tuut-Tuut-Legende“, „Justizirrtum“, „Sherlock Halunk“ …) und
  ein **teilbares Poster** für Insta/TikTok.

| Anruf (Sicht des Opfers) | Chaos-Karte | Razzia |
| --- | --- | --- |
| ![Anruf](docs/anruf-opfer.jpg) | ![Chaos](docs/chaos-karte.jpg) | ![Razzia](docs/razzia.jpg) |

| Lobby | Auswertung | Handy |
| --- | --- | --- |
| ![Lobby](docs/lobby.jpg) | ![Auswertung](docs/auswertung.jpg) | ![Handy](docs/handy.jpg) |

## Warum das für Content funktioniert

- **Eingebaute Clip-Momente:** riesiges „AUFGELEGT!“ mit Besetztzeichen, Geldregen bei Überweisungen, Fake-Beweise
  in Comic Sans, Chaos-Karten mit Ansager-Stimme, Polizeisirene und Verbrecherfoto bei der Razzia.
- **Improvisation statt Wissen:** Jeder kann mitspielen, die Lacher entstehen durch Stimmen, Maschen und Chaos.
- **Zuschauer machen mit:** Zuschauer treten mit dem Raumcode als **Publikum** bei, schicken fliegende Emoji-Reaktionen
  (mit ihrem Namen) und tippen bei der Razzia mit („Publikum tippte auf Kevin – daneben!“).
- **Streamer-Modus** (🎥): versteckt Raumcode und QR-Code, damit der Stream nicht gecrasht wird.
- **Werbefreundlich:** Parodie ohne Beleidigungen oder Gewalt. Zwischendurch laufen echte Anti-Scam-Tipps
  („Die echte Polizei fragt nie am Telefon nach Geld“).

## Features

- Räume mit 4-Buchstaben-Code, Einladungslink und QR-Code
- Lobby mit Avataren/Farben, Host-Krone, Kick, Einstellungen (Runden, Anrufdauer, Anrufer pro Runde, Budget,
  Cop/Chaos/Stimmen/Zuschauer an/aus) und geschätzter Spieldauer
- 32 Maschen mit Fake-Beweisen, 23 Opfer-Rollen, 32 Pflicht-Stimmen, 36 Chaos-Karten
- Soundboard (Airhorn, Modem, Trommelwirbel, Traurige Posaune …) – **alle Sounds werden live synthetisiert**,
  keine Audiodateien und keine Lizenzprobleme
- Ansager-Stimme (Text-to-Speech des Browsers), abschaltbar
- Host-Steuerung: Pause, Phase überspringen, Spiel beenden
- Wiederverbinden nach Reload oder Verbindungsabbruch (Rolle und Punkte bleiben), Host-Übergabe bei Abgang
- Mobil-optimiert – Spieler können am Handy spielen, der Streamer am PC
- Schriften lokal eingebunden (kein Google-CDN, DSGVO-freundlich), Link-Vorschaubild für Discord/WhatsApp

## Schnellstart (lokal)

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20.19 (empfohlen: 22).

```bash
cd hotline-halunken
npm install
npm run build
npm start
```

Dann **http://localhost:3000** öffnen. Zum Testen allein einfach mehrere Browser-Tabs öffnen – jeder Tab ist ein
eigener Spieler.

**Mit Freunden im selben WLAN:** Deine lokale IP herausfinden (z. B. `192.168.0.23`) und die anderen öffnen
`http://192.168.0.23:3000`.

### Entwicklung

```bash
npm run dev    # Server (Port 3000, Auto-Reload) + Vite-Dev-Server mit Hot-Reload auf http://localhost:5173
npm test       # Spiellogik-Tests: spielt ein komplettes Spiel mit Bots im Zeitraffer durch
```

## Online stellen (damit Freunde übers Internet mitspielen)

Das Spiel braucht einen Server mit **WebSockets** – reines Static-Hosting oder Vercel funktioniert dafür **nicht**.
Gut geeignet (jeweils mit Gratis-Stufe):

**Render (am einfachsten):**
1. Auf [render.com](https://render.com) einloggen → **New + → Blueprint** → dieses GitHub-Repo auswählen.
2. Render liest `hotline-halunken/render.yaml` und richtet alles automatisch ein.
3. Nach dem Build bekommst du eine URL wie `https://hotline-halunken.onrender.com` – fertig.

> Hinweis: Der Gratis-Plan von Render schläft nach Inaktivität ein; der erste Aufruf dauert dann ~30 Sekunden.

**Railway / Fly.io / eigener Server (Docker):**

```bash
cd hotline-halunken
docker build -t hotline-halunken .
docker run -p 3000:3000 hotline-halunken
```

Ohne Docker: `npm ci && npm run build && npm start` – der Server nimmt den Port aus der Umgebungsvariable `PORT`.

### Umgebungsvariablen

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `PORT` | `3000` | Port des Servers |
| `HH_TIME_SCALE` | `1` | Zeitfaktor für alle Timer (z. B. `0.5` = doppelt so schnell, zum Testen) |
| `CORS_ORIGIN` | – | Nur nötig, wenn Frontend und Server auf verschiedenen Domains laufen (Komma-getrennt) |

## So wird gespielt (Kurzfassung)

1. **Host** eröffnet einen Raum, teilt Code/Link. Alle wählen Name, Avatar und Farbe. Ab 3 Spielern kann es losgehen.
2. **Schichtbeginn:** Das Opfer liest seine Rolle (inkl. geheimem Tick), die Halunken wählen 1 von 2 Maschen.
3. **Anrufe:** Jeder Halunke hat z. B. 60 Sekunden. Das Opfer überweist, dreht am Vertrauen, nutzt die Warteschleife
   (1× pro Anruf) oder legt auf (frühestens nach 8 Sekunden). Der Anrufer kann 1× einen Fake-Beweis schicken.
4. **Razzia** (ab 4 Spielern): Alle stimmen ab, wer der Cop war. Richtig getippt: +15 % des Budgets.
   Cop entkommt: +30 % Fluchtbonus **und** er beschlagnahmt die Rundenbeute des reichsten Halunken.
5. **Kassensturz** nach jeder Runde, am Ende Podest, Awards und Poster.

Das Opfer wechselt jede Runde. Geld, das das Opfer am Rundenende noch hat, verfällt – es soll also verteilen!

## Inhalte anpassen

Alle Karten stehen in **`server/content.js`** – einfach neue Einträge ergänzen:

- `MASCHEN` – Maschen inkl. Fake-Beweis (`proof`)
- `PERSONAS` – Opfer-Rollen
- `VOICES` – Pflicht-Stimmen
- `CHAOS` – Chaos-Karten (`{caller}` und `{victim}` werden durch Namen ersetzt)
- `TIPS` – Tipps auf den Warte-Bildschirmen

Punkte, Zeiten und Grenzen stehen oben in **`server/room.js`** (`DUR`, `DEFAULT_SETTINGS`, `MIN_PLAYERS` …).

## Projektstruktur

```
hotline-halunken/
  server/
    index.js      Express + Socket.io, Räume, Rate-Limits, Auslieferung des Frontends
    room.js       Komplette Spiellogik (Phasen, Timer, Punkte, Razzia, Awards, Sichtbarkeit pro Spieler)
    content.js    Alle Karten und Texte
  client/
    index.html
    src/
      App.jsx               Phasen-Routing, Phasen-Sounds, Pause-Overlay
      screens/              Home, Lobby, Rollen, Anruf, Anruf-Ergebnis, Razzia, Rundenergebnis, Auswertung
      components/           Avatare, Karten, Timer, Effekte (Geldregen, AUFGELEGT, Chaos), Reaktionen, Top-Bar
      lib/                  Netzwerk/Store, Sound-Synthese + Ansager, Poster-Generator, Hooks
      styles.css
  test/game.test.js         Automatischer Durchlauf eines kompletten Spiels
  Dockerfile, render.yaml
```

Der Server ist autoritativ: Jeder Client bekommt nur die Informationen, die er sehen darf (der Cop bleibt geheim,
Maschen werden erst nach dem Anruf aufgedeckt, das Geheimnis des Opfers sieht nur das Opfer).

## Ideen für später

- Englische Version (alle Texte liegen gesammelt in `content.js` und den Screens)
- Echter In-Game-Voice-Chat (WebRTC) statt Discord
- Twitch-Chat-Integration für Publikums-Abstimmungen

---

*Parodie. Scammer sind keine Vorbilder. Wenn dich im echten Leben jemand so anruft: auflegen – und im Zweifel 110 wählen.*
