export const SITE = {
  name: "ROTHERWERK",
  claim: "Digitale Sichtbarkeit für den Mittelstand",
  url: "https://rotherwerk.de",
  email: "hallo@rotherwerk.de",
  phone: "+49 521 1234567",
  phoneHref: "+495211234567",
  city: "Bielefeld",
  addressLine: "Bielefeld, Deutschland",
};

export const NAV_LINKS = [
  { href: "#leistungen", label: "Leistungen" },
  { href: "#warum-wir", label: "Warum wir" },
  { href: "#showcase", label: "Showcase" },
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#kontakt", label: "Kontakt" },
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

export const SHOWCASE_ITEMS = [
  { id: 1, label: "Drohnenaufnahme", tag: "Restaurant Außenansicht", size: "large" },
  { id: 2, label: "POV-Clip", tag: "Küche in Aktion", size: "small" },
  { id: 3, label: "Drohnenaufnahme", tag: "Skyline Bielefeld", size: "small" },
  { id: 4, label: "Social Reel", tag: "Behind the Scenes", size: "medium" },
  { id: 5, label: "POV-Clip", tag: "Service am Tisch", size: "medium" },
  { id: 6, label: "Drohnenaufnahme", tag: "Betriebsgelände", size: "small" },
];
