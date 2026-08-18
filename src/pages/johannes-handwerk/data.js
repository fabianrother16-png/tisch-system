// Zentrale Beispiel-/Platzhalterdaten für die Johannes-Handwerk Demo-Website.
// ACHTUNG: Alle Inhalte, die nicht direkt aus dem Kunden-Briefing stammen
// (Bewertungen, Vorher/Nachher-Bilder, Erfahrungswerte), sind Platzhalter
// und müssen vor dem echten Launch durch reale Kundendaten ersetzt werden.

export const COMPANY = {
  name: 'Johannes-Handwerk',
  slogan: 'Ihr Profi im Handwerksbereich – Fair & Kompetent',
  address: {
    street: 'An der Schäferwiese 6',
    zip: '81245',
    city: 'München',
    full: 'An der Schäferwiese 6, 81245 München',
  },
  phone1: '0176 81318236',
  phone2: '089 41172411',
  phoneHref1: 'tel:+4917681318236',
  phoneHref2: 'tel:+498941172411',
  whatsapp: 'https://wa.me/4917681318236',
  email: 'info@johannes-handwerk.de',
  serviceArea: 'München und Umland (ca. 30 km Radius)',
  openingHours: [
    { day: 'Montag – Freitag', time: '07:30 – 18:00 Uhr' },
    { day: 'Samstag', time: 'nach Vereinbarung' },
    { day: 'Sonntag', time: 'geschlossen' },
  ],
};

// lucide-react Icon-Namen werden in den Komponenten aufgelöst
export const SERVICES = [
  {
    id: 'aussenanlagen',
    icon: 'TreePine',
    title: 'Außenanlagen',
    subtitle: 'Planung & Gestaltung',
    description:
      'Terrassenreparatur und Gartenbau aus einer Hand – von der ersten Idee bis zur letzten Pflanze.',
    details: [
      'Terrassen- und Balkonreparatur',
      'Gartenneuanlage & Umgestaltung',
      'Zäune, Sichtschutz & Beeteinfassungen',
      'Bewässerung & Beleuchtung',
    ],
  },
  {
    id: 'sanierung',
    icon: 'Hammer',
    title: 'Sanierungsarbeiten',
    subtitle: 'Renovierung & Umbau',
    description:
      'Vom Trockenbau bis zum kompletten Umbau – wir sanieren fachgerecht und termingerecht.',
    details: [
      'Renovierung von Wohn- & Geschäftsräumen',
      'Trockenbau & Dämmung',
      'Um- und Ausbauten',
      'Boden-, Wand- & Deckenarbeiten',
    ],
  },
  {
    id: 'pflaster',
    icon: 'Grid3x3',
    title: 'Pflasterarbeiten',
    subtitle: 'Beton & Naturstein',
    description:
      'Hauseingang, Einfahrt, Gartenweg oder Terrasse – sauber verlegt, für Jahrzehnte gemacht.',
    details: [
      'Hauseingänge & Einfahrten',
      'Gartenwege & Terrassenflächen',
      'Beton- und Natursteinpflaster',
      'Entwässerung & Randeinfassung',
    ],
  },
  {
    id: 'instandsetzung',
    icon: 'Wrench',
    title: 'Instandsetzungen',
    subtitle: 'Klein bis groß',
    description:
      'Allgemeine Reparaturen und Instandsetzungen rund ums Zuhause – schnell, zuverlässig, fair.',
    details: [
      'Kleinreparaturen aller Art',
      'Wartung & Instandhaltung',
      'Notfall- & Express-Einsätze',
      'Individuelle Handwerkerlösungen',
    ],
  },
];

export const TRUST_POINTS = [
  {
    icon: 'Award',
    title: 'Langjährige Erfahrung',
    description: 'Jahrelange Praxis in allen Kernbereichen des Handwerks – wir kennen die Details, auf die es ankommt.',
  },
  {
    icon: 'CalendarCheck',
    title: 'Termintreue',
    description: 'Vereinbarte Termine halten wir ein. Ihre Zeit ist uns genauso wichtig wie unsere.',
  },
  {
    icon: 'HandCoins',
    title: 'Faire Preise',
    description: 'Transparente Kalkulation ohne versteckte Kosten – ein fairer Preis für ehrliche Arbeit.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Festpreisgarantie',
    description: 'Nach dem Kostenvoranschlag keine Überraschungen: Der vereinbarte Preis gilt.',
  },
];

// Platzhalter-Bewertungen – als Beispiel gekennzeichnet.
// Später 1:1 durch echte Google-Rezensionen ersetzbar (gleiche Datenstruktur).
export const TESTIMONIALS = [
  {
    name: 'M. Fischer',
    location: 'München-Trudering',
    rating: 5,
    text: 'Unsere Terrasse wurde neu gepflastert – schnell, sauber und absolut termingerecht. Der Preis wurde exakt wie besprochen eingehalten.',
    service: 'Pflasterarbeiten',
  },
  {
    name: 'S. Winter',
    location: 'München-Haidhausen',
    rating: 5,
    text: 'Sehr kompetente Beratung bei der Sanierung unseres Badezimmers. Man hat gemerkt: Hier arbeiten echte Profis, die mitdenken.',
    service: 'Sanierungsarbeiten',
  },
  {
    name: 'K. Bauer',
    location: 'Unterhaching',
    rating: 5,
    text: 'Kleinreparaturen im ganzen Haus in einem Rutsch erledigt. Unkompliziert, freundlich und fair abgerechnet.',
    service: 'Instandsetzungen',
  },
  {
    name: 'A. Novak',
    location: 'München-Bogenhausen',
    rating: 4,
    text: 'Unser Garten wurde komplett neu gestaltet. Tolles Ergebnis, minimal längere Bauzeit wegen Wetter – wurde aber gut kommuniziert.',
    service: 'Außenanlagen',
  },
];

// Platzhalter Vorher/Nachher-Bildpaare – aktuell als Farbflächen mit Icon
// dargestellt, damit die Demo ohne echte Kundenfotos auskommt.
export const GALLERY_PROJECTS = [
  {
    id: 1,
    title: 'Hofeinfahrt in Pflasterstein',
    category: 'Pflasterarbeiten',
    beforeLabel: 'Vorher – rissige Betonfläche',
    afterLabel: 'Nachher – neues Natursteinpflaster',
  },
  {
    id: 2,
    title: 'Terrassen-Sanierung',
    category: 'Außenanlagen',
    beforeLabel: 'Vorher – verwitterte Holzterrasse',
    afterLabel: 'Nachher – neue Terrassenfläche',
  },
  {
    id: 3,
    title: 'Badsanierung komplett',
    category: 'Sanierungsarbeiten',
    beforeLabel: 'Vorher – altes Bad',
    afterLabel: 'Nachher – moderne Ausstattung',
  },
];

export const SERVICE_OPTIONS = [
  { value: '', label: 'Bitte auswählen…' },
  { value: 'aussenanlagen', label: 'Außenanlagen (Planung & Gestaltung)' },
  { value: 'sanierung', label: 'Sanierungsarbeiten' },
  { value: 'pflaster', label: 'Pflasterarbeiten' },
  { value: 'instandsetzung', label: 'Instandsetzungen' },
  { value: 'sonstiges', label: 'Sonstiges Anliegen' },
];

// Regelbasierte Wissensbasis für den Demo-Chatbot.
// Struktur bewusst simpel gehalten: jede Regel hat Keywords + Antwort.
// Für eine echte LLM-Anbindung könnte statt matchBotAnswer() ein Aufruf an
// eine Chat-Completion-API (z. B. Anthropic Claude) treten – siehe Chatbot.jsx.
export const BOT_FAQ = [
  {
    keywords: ['leistung', 'anbieten', 'macht ihr', 'service', 'was könnt'],
    answer:
      'Wir übernehmen vier große Bereiche: Außenanlagen (Terrasse & Garten), Sanierungsarbeiten, Pflasterarbeiten sowie allgemeine Instandsetzungen im und ums Zuhause. Wofür brauchen Sie Unterstützung?',
  },
  {
    keywords: ['münchen', 'umland', 'einsatzgebiet', 'wo arbeitet', 'gebiet', 'anfahrt'],
    answer:
      'Wir sind in ganz München und im Umland (ca. 30 km) unterwegs – von Trudering bis Unterhaching war schon alles dabei. Sagen Sie mir gerne Ihren Ort, dann kann ich grob einschätzen, wie schnell wir da sein können.',
  },
  {
    keywords: ['reaktionszeit', 'wie schnell', 'wann könnt', 'wartezeit', 'termin frei', 'wie lange dauert'],
    answer:
      'In der Regel melden wir uns innerhalb eines Werktags zurück, ein Kostenvoranschlag steht meist innerhalb von 24 Stunden. Bei akuten Fällen sind wir oft auch kurzfristig vor Ort.',
  },
  {
    keywords: ['kostenvoranschlag', 'angebot', 'kostet', 'preis', 'was kostet', 'kosten'],
    answer:
      'Ein Kostenvoranschlag ist bei uns kostenlos und unverbindlich: Sie schildern kurz Ihr Anliegen (am besten mit Fotos), wir schauen uns die Lage an – vor Ort oder telefonisch – und Sie erhalten meist innerhalb von 24h einen fairen Festpreis. Soll ich Sie direkt zum Kontaktformular weiterleiten?',
  },
  {
    keywords: ['ablauf', 'wie läuft', 'wie funktioniert'],
    answer:
      'Ganz einfach: 1) Sie schildern uns Ihr Anliegen (Formular, Anruf oder WhatsApp). 2) Wir besprechen Details und ggf. einen Vor-Ort-Termin. 3) Sie erhalten einen Festpreis. 4) Nach Ihrer Zusage legen wir termingerecht los.',
  },
  {
    keywords: ['garantie', 'festpreis', 'sicher'],
    answer:
      'Ja – nach dem Kostenvoranschlag gilt der vereinbarte Festpreis. Keine versteckten Kosten, keine bösen Überraschungen.',
  },
  {
    keywords: ['öffnungszeit', 'geöffnet', 'erreichbar', 'wann seid ihr'],
    answer:
      'Montag bis Freitag sind wir 07:30–18:00 Uhr für Sie da, samstags nach Vereinbarung. Am schnellsten erreichen Sie uns telefonisch oder über das Kontaktformular.',
  },
  {
    keywords: ['termin', 'vereinbaren', 'buchen', 'kalender'],
    answer:
      'Termine können Sie ganz einfach über unseren Terminkalender weiter unten auf der Seite anfragen, oder Sie nutzen das Kontaktformular – ich leite Sie gerne direkt dorthin.',
  },
  {
    keywords: ['danke', 'super', 'klasse', 'perfekt'],
    answer: 'Sehr gerne! Wenn Sie mögen, leite ich Sie direkt zum Kostenvoranschlag-Formular weiter – oder haben Sie noch eine Frage?',
  },
  {
    keywords: ['hallo', 'hi', 'servus', 'guten tag', 'moin'],
    answer:
      'Servus! Schön, dass Sie da sind. Ich bin der digitale Assistent von Johannes-Handwerk und helfe Ihnen gerne mit ersten Fragen zu unseren Leistungen, Terminen oder dem Ablauf eines Kostenvoranschlags weiter. Was kann ich für Sie tun?',
  },
];

export const BOT_QUICK_REPLIES = [
  'Welche Leistungen bietet ihr an?',
  'Wie schnell bekomme ich ein Angebot?',
  'Arbeitet ihr auch im Umland?',
  'Ich möchte einen Termin anfragen',
];

export const BOT_FALLBACK =
  'Das kann ich Ihnen aus dem Stand nicht sicher beantworten – am besten schildern Sie Ihr Anliegen kurz über unser Kontaktformular oder rufen direkt an, dann kümmert sich unser Team persönlich darum. Soll ich Sie zum Formular weiterleiten?';
