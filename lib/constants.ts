export const SITE = {
  name: "SICHTWERK",
  claim: "Digitale Sichtbarkeit für den Mittelstand",
  url: "https://sichtwerk.de",
  email: "hallo@sichtwerk.de",
  phone: "+49 5241 1234567",
  phoneHref: "+4952411234567",
  city: "Gütersloh",
  addressLine: "Gütersloh, Deutschland",
};

export const NAV_LINKS = [
  { href: "#leistungen", label: "Leistungen", number: "01" },
  { href: "#warum-wir", label: "Warum wir", number: "02" },
  { href: "#showcase", label: "Showcase", number: "03" },
  { href: "#ueber-uns", label: "Über uns", number: "04" },
  { href: "#ablauf", label: "Ablauf", number: "05" },
  { href: "#kontakt", label: "Kontakt", number: "06" },
];

export type Service = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon:
    | "star"
    | "profile"
    | "nfc"
    | "website"
    | "social"
    | "ads"
    | "seo"
    | "camera";
};

export const SERVICES: Service[] = [
  {
    id: "rezensionsmanagement",
    number: "01",
    title: "Rezensionsmanagement",
    description:
      "Mehr positive Google-Bewertungen gezielt aufbauen und aktiv managen.",
    icon: "star",
  },
  {
    id: "google-unternehmensprofil",
    number: "02",
    title: "Google-Unternehmensprofil",
    description:
      "Optimierung des Google-Business-Profils für bessere lokale Sichtbarkeit.",
    icon: "profile",
  },
  {
    id: "nfc-bewertungskarten",
    number: "03",
    title: "NFC-Bewertungskarten",
    description:
      "Physische Karten, mit denen Kunden in Sekunden eine Bewertung hinterlassen.",
    icon: "nfc",
  },
  {
    id: "website",
    number: "04",
    title: "Website",
    description: "Individuelle, schnelle und conversion-starke Webseiten.",
    icon: "website",
  },
  {
    id: "social-media",
    number: "05",
    title: "Social Media",
    description:
      "Aufbau und laufende Content-Betreuung der Unternehmensprofile.",
    icon: "social",
  },
  {
    id: "meta-ads",
    number: "06",
    title: "Meta Ads",
    description: "Zielgerichtete Kampagnen auf Instagram & Facebook.",
    icon: "ads",
  },
  {
    id: "seo-optimierung",
    number: "07",
    title: "SEO-Optimierung",
    description: "Technisch und inhaltlich für bessere Rankings.",
    icon: "seo",
  },
  {
    id: "foto-video",
    number: "08",
    title: "Foto & Video (Drohne + POV)",
    description:
      "Hochwertiges Bild- und Videomaterial, das wir selbst vor Ort produzieren.",
    icon: "camera",
  },
];

export const USPS = [
  {
    number: "01",
    title: "Wir produzieren selbst",
    description:
      "Drohnenaufnahmen und POV-Kamera-Clips entstehen bei uns nicht vom Stock-Footage-Server, sondern vor Ort bei euch – authentisch, hochwertig und exklusiv für eure Marke.",
  },
  {
    number: "02",
    title: "Strategie statt Bauchgefühl",
    description:
      "Jede Maßnahme zahlt auf ein Ziel ein: mehr Sichtbarkeit, mehr Anfragen, mehr Umsatz. Wir denken in Ergebnissen, nicht in Buzzwords.",
  },
  {
    number: "03",
    title: "Alles aus einer Hand",
    description:
      "Von der Bewertung bei Google bis zur Meta-Ad-Kampagne – ihr habt einen Ansprechpartner statt fünf Agenturen, die aneinander vorbeiarbeiten.",
  },
  {
    number: "04",
    title: "Mittelstand ist unser Zuhause",
    description:
      "Wir kennen die Herausforderungen von Restaurants und lokalen Betrieben aus erster Hand – kurze Wege, klare Sprache, ehrliche Preise.",
  },
];

export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Erstgespräch",
    description:
      "Kostenlos und unverbindlich lernen wir euren Betrieb, eure Ziele und Herausforderungen kennen.",
  },
  {
    number: "02",
    title: "Strategie & Angebot",
    description:
      "Wir erarbeiten ein individuelles Konzept mit konkreten Maßnahmen, Zeitplan und transparenten Kosten.",
  },
  {
    number: "03",
    title: "Umsetzung vor Ort",
    description:
      "Unser Team dreht Drohnen- und POV-Aufnahmen, baut euer Profil auf und startet die ersten Kampagnen.",
  },
  {
    number: "04",
    title: "Betreuung & Wachstum",
    description:
      "Laufendes Monitoring, Optimierung und Reporting – wir bleiben dran, damit eure Sichtbarkeit stetig wächst.",
  },
];

// query = Recherche-Suchbegriff für lizenzfreies Unsplash/Pexels-Material,
// das hier vorübergehend die editorielle Platzhalter-Grafik ersetzt (siehe
// TODO-Kommentare in components/Showcase.tsx).
export const SHOWCASE_ITEMS = [
  {
    id: 1,
    label: "Drohnenaufnahme",
    tag: "Restaurant Außenansicht",
    size: "large",
    type: "video" as const,
    pattern: "bokeh" as const,
    query: "restaurant exterior evening warm lighting",
  },
  {
    id: 2,
    label: "POV-Clip",
    tag: "Küche in Aktion",
    size: "small",
    type: "video" as const,
    pattern: "motion" as const,
    query: "chef kitchen action shot",
  },
  {
    id: 3,
    label: "Drohnenaufnahme",
    tag: "Skyline Gütersloh",
    size: "small",
    type: "photo" as const,
    pattern: "aerial" as const,
    query: "Gütersloh Stadt Skyline",
  },
  {
    id: 4,
    label: "Social Reel",
    tag: "Behind the Scenes",
    size: "medium",
    type: "video" as const,
    pattern: "lens" as const,
    query: "camera gimbal filming content creator",
  },
  {
    id: 5,
    label: "POV-Clip",
    tag: "Service am Tisch",
    size: "medium",
    type: "video" as const,
    pattern: "bokeh" as const,
    query: "restaurant service table warm lighting",
  },
  {
    id: 6,
    label: "Drohnenaufnahme",
    tag: "Rathaus Gütersloh",
    size: "small",
    type: "photo" as const,
    pattern: "aerial" as const,
    query: "aerial drone city rooftop Germany",
  },
];

export const MARQUEE_ITEMS = [
  "Rezensionen",
  "Google-Profil",
  "SEO",
  "Meta Ads",
  "Social Media",
  "Content-Produktion",
];

export const MARQUEE_ITEMS_REGIONAL = ["Sichtbar in Gütersloh & OWL"];

// Ehrliche Fakten, die JETZT schon stimmen – keine Kundenzahlen oder
// erfundenen Kennzahlen, siehe Leitplanke im Prompt. `isYear` markiert das
// einzige Feld mit echtem Zahlenwert, das die Count-up-Animation bekommt.
export const TRUST_FACTS = [
  { label: "Gegründet", value: "2026", isYear: true },
  { label: "Sitz in", value: "Gütersloh" },
  { label: "Eigene Ausrüstung", value: "Drohne & Kamera" },
];

export const REGIONAL_CITIES = ["Gütersloh", "Bielefeld", "Paderborn", "Herford"];

// Google-Maps-Embed ohne API-Key (klassisches output=embed), zentriert auf
// Gütersloh.
export const MAPS_EMBED_SRC =
  "https://maps.google.com/maps?q=G%C3%BCtersloh,Deutschland&z=10&output=embed";

export const PROBLEM_POINTS = [
  "Der Betrieb ist bei Google schwer zu finden – oder taucht gar nicht erst auf der ersten Seite auf.",
  "Es gibt kaum oder keine aktuellen Bewertungen, die potenzielle Kunden überzeugen könnten.",
  "Die Website ist veraltet, langsam oder auf dem Handy kaum bedienbar.",
];

export const SOLUTION_POINTS = [
  "Wir optimieren Google-Profil und lokale Suche, damit der Betrieb dort gefunden wird, wo gesucht wird.",
  "Wir bauen aktives Rezensionsmanagement auf – von der Bitte um Bewertung bis zur NFC-Karte am Tisch.",
  "Wir liefern eine schnelle, moderne Website, die auf jedem Gerät überzeugt.",
];

export const COMPARISON_ROWS = [
  {
    generic: "Nur eine Website",
    sichtwerk: "Website, Rezensionen, SEO & Content-Produktion aus einer Hand",
  },
  {
    generic: "Foto/Video an externe Dienstleister ausgelagert",
    sichtwerk: "Eigenes Kamera- & Drohnen-Team, das selbst vor Ort dreht",
  },
  {
    generic: "Fester Ansprechpartner wechselt häufig",
    sichtwerk: "Direkter Draht zu den Gründern",
  },
  {
    generic: "Austauschbare Templates",
    sichtwerk: "Individuelles Design für jeden Betrieb",
  },
  {
    generic: "Reporting nur auf Nachfrage",
    sichtwerk: "Laufende Betreuung & Optimierung",
  },
  {
    generic: "Fokus auf Großstädte",
    sichtwerk: "Fokus auf Mittelstand & Region OWL",
  },
];

// TODO: durch echte Kundenstimmen ersetzen, sobald vorhanden. Solange dieses
// Array leer ist, rendert components/Testimonials.tsx bewusst nichts – siehe
// Kommentar dort.
export type Testimonial = {
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
};
export const TESTIMONIALS: Testimonial[] = [];

export const FAQ_ITEMS = [
  {
    question: "Wie läuft der Einstieg ab?",
    answer:
      "Mit einem kostenlosen, unverbindlichen Erstgespräch. Danach erarbeiten wir ein individuelles Konzept mit konkreten Maßnahmen, Zeitplan und transparenten Kosten – erst wenn das passt, geht es los.",
  },
  {
    question: "Wie lange dauert ein Website-Projekt?",
    answer:
      "Das hängt vom Umfang ab. Eine schlanke One-Page-Website ist in der Regel schneller fertig als ein umfangreicher Auftritt mit mehreren Unterseiten – den genauen Zeitrahmen legen wir im Erstgespräch gemeinsam fest.",
  },
  {
    question: "Erstellt ihr auch die Texte?",
    answer:
      "Ja. Wir können Texte komplett für euch schreiben oder eure vorhandenen Inhalte überarbeiten – je nachdem, was ihr schon habt und was ihr euch wünscht.",
  },
  {
    question: "Müssen wir eigenes Kamera-Equipment bereitstellen?",
    answer:
      "Nein. Wir bringen unsere eigene Drohnen- und POV-Kamera-Ausrüstung mit und produzieren das Bild- und Videomaterial direkt bei euch vor Ort.",
  },
  {
    question: "Arbeitet ihr auch außerhalb von Gütersloh?",
    answer:
      "Ja. Unser Fokus liegt auf Gütersloh und der Region OWL, inklusive Bielefeld, Paderborn und Herford – sprecht uns gerne an, wenn ihr etwas weiter entfernt seid.",
  },
  {
    question: "Was kostet die Zusammenarbeit?",
    answer:
      "Das ist individuell, je nachdem welche Leistungen ihr braucht. Im Erstgespräch besprechen wir euren Bedarf und ihr bekommt ein transparentes, unverbindliches Angebot.",
  },
];
