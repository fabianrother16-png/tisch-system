// ---------------------------------------------------------------------------
// Zentrale Inhalte der Website
// ---------------------------------------------------------------------------
// Diese Datei bündelt alle austauschbaren Texte, Kontaktdaten und Inhalte.
// Wer Texte, Leistungen, Referenzbilder oder Firmendaten ändern möchte,
// muss (fast) nur diese Datei bearbeiten – die Komponenten lesen ihre
// Inhalte von hier.
// ---------------------------------------------------------------------------

export const company = {
  name: "Fliesen Khalil",
  claim: "Präzise. Fair. Kompetent. Zuverlässig.",
  founderTitle: "Ihr Fliesenlegermeister-Betrieb in Dortmund",
  address: {
    street: "Blumenkamp 13",
    zip: "44369",
    city: "Dortmund",
    country: "DE",
    countryName: "Deutschland",
  },
  phone: "0172 344 15 80",
  // Telefonlink im internationalen Format (für tel:-Links / strukturierte Daten)
  phoneHref: "tel:+491723441580",
  email: "info@fliesen-khalil.de",
  emailHref: "mailto:info@fliesen-khalil.de",
  // Für schema.org / OpenGraph – ggf. auf die echte Domain anpassen
  url: "https://www.fliesen-khalil.de",
  openingHours: [
    { days: "Montag – Freitag", hours: "08:00 – 18:00 Uhr" },
    { days: "Samstag", hours: "Nach Vereinbarung" },
    { days: "Sonntag", hours: "Geschlossen" },
  ],
  serviceArea: [
    "Dortmund",
    "Bochum",
    "Witten",
    "Herne",
    "Castrop-Rauxel",
    "Lünen",
    "Umgebung",
  ],
};

export const partners = [
  {
    name: "Schlüter Systems",
    description: "Profilsysteme, Abdichtung & Entkopplung",
  },
  {
    name: "Sakret",
    description: "Baustoffe, Mörtel & Fliesenkleber",
  },
  {
    name: "Fliesenrabatte",
    description: "Fliesen & Naturstein im Großhandel",
  },
];

// Vier Werte, die im Über-uns-Bereich als Karten dargestellt werden.
export const values = [
  {
    title: "Planungssicherheit",
    description:
      "Von der ersten Beratung bis zur Übergabe – klare Absprachen, realistische Zeitpläne und volle Transparenz.",
  },
  {
    title: "Saubere Verlegung",
    description:
      "Millimetergenaue Ausführung, ordentliche Baustelle und Materialien, die wir selbst empfehlen würden.",
  },
  {
    title: "Volle Zufriedenheit",
    description:
      "Wir arbeiten erst dann fertig, wenn das Ergebnis auch unseren eigenen Ansprüchen genügt.",
  },
  {
    title: "Feste Preise",
    description:
      "Ein transparentes Angebot vorab – keine versteckten Kosten, keine bösen Überraschungen.",
  },
];

// Icon-Namen entsprechen den Exporten aus "lucide-react" (siehe components/Services.tsx)
export const services = [
  {
    id: "konzeptentwicklung",
    icon: "PenTool",
    title: "Konzeptentwicklung",
    short: "Beratung bei Material, Farbe & Design",
    description:
      "Wir beraten Sie persönlich zu Fliesenformaten, Farbwelten und Verlegemustern – abgestimmt auf Ihren Raum, Ihren Geschmack und Ihr Budget.",
  },
  {
    id: "verlegung",
    icon: "LayoutGrid",
    title: "Verlegung von Fliesen, Platten & Mosaik",
    short: "Für Böden, Wände, Küchen, Bäder",
    description:
      "Fachgerechte Verlegung für Wohn- und Nassräume – von der klassischen Wandfliese bis zum aufwendigen Mosaik in Küche und Bad.",
  },
  {
    id: "balkone-terrassen",
    icon: "Sun",
    title: "Balkone & Terrassen",
    short: "Wetterbeständige Lösungen im Außenbereich",
    description:
      "Frostsichere Fliesen- und Natursteinbeläge für Balkon und Terrasse, fachgerecht im Gefälle verlegt – dauerhaft schön bei jedem Wetter.",
  },
  {
    id: "silikonversiegelung",
    icon: "Droplets",
    title: "Silikonversiegelung",
    short: "Dauerhafte Abdichtung gegen Feuchtigkeit",
    description:
      "Saubere, dauerhaft elastische Silikonfugen an Anschlüssen und Übergängen – zuverlässiger Schutz vor Feuchtigkeitsschäden.",
  },
  {
    id: "barrierefreie-baeder",
    icon: "Accessibility",
    title: "Barrierefreie Bäder",
    short: "Komfort und Sicherheit ohne Stilverlust",
    description:
      "Bodengleiche Duschen und rutschhemmende Beläge für mehr Sicherheit im Alltag – geplant und umgesetzt, ohne auf Design zu verzichten.",
  },
  {
    id: "naturstein",
    icon: "Mountain",
    title: "Naturstein",
    short: "Böden, Wände, Arbeitsplatten",
    description:
      "Marmor, Granit, Schiefer & Co. – wir beraten zu Pflege, Verlegung und Schutz von Naturstein und setzen ihn fachgerecht in Szene.",
  },
] as const;

// Referenzgalerie – Platzhalterstruktur.
// `image: null` sorgt dafür, dass ein gestalteter Platzhalter angezeigt wird.
// Sobald echte Fotos vorliegen: Datei nach /public/images/gallery/ legen und
// hier z.B. image: "/images/gallery/bad-dortmund-01.jpg" eintragen.
export type GalleryCategory =
  | "Alle"
  | "Bäder"
  | "Böden"
  | "Terrassen"
  | "Naturstein";

export const galleryCategories: GalleryCategory[] = [
  "Alle",
  "Bäder",
  "Böden",
  "Terrassen",
  "Naturstein",
];

export const galleryItems: {
  id: string;
  category: Exclude<GalleryCategory, "Alle">;
  title: string;
  location: string;
  image: string | null;
  alt: string;
}[] = [
  {
    id: "ref-01",
    category: "Bäder",
    title: "Barrierefreies Bad",
    location: "Dortmund-Innenstadt",
    image: null,
    alt: "Barrierefreies Badezimmer mit bodengleicher Dusche in Dortmund",
  },
  {
    id: "ref-02",
    category: "Böden",
    title: "Großformat-Fliesenboden",
    location: "Dortmund-Hörde",
    image: null,
    alt: "Wohnbereich mit großformatigem Fliesenboden in Dortmund-Hörde",
  },
  {
    id: "ref-03",
    category: "Terrassen",
    title: "Terrasse mit Feinsteinzeug",
    location: "Witten",
    image: null,
    alt: "Wetterbeständige Terrassenfliesen aus Feinsteinzeug in Witten",
  },
  {
    id: "ref-04",
    category: "Naturstein",
    title: "Naturstein-Arbeitsplatte",
    location: "Dortmund-Aplerbeck",
    image: null,
    alt: "Küche mit Naturstein-Arbeitsplatte in Dortmund-Aplerbeck",
  },
  {
    id: "ref-05",
    category: "Bäder",
    title: "Mosaik-Dusche",
    location: "Bochum",
    image: null,
    alt: "Duschbereich mit Mosaikfliesen in Bochum",
  },
  {
    id: "ref-06",
    category: "Böden",
    title: "Fischgrät-Verlegung",
    location: "Dortmund-Kreuzviertel",
    image: null,
    alt: "Flur mit Fliesen im Fischgrätmuster in Dortmund-Kreuzviertel",
  },
  {
    id: "ref-07",
    category: "Terrassen",
    title: "Balkonsanierung",
    location: "Castrop-Rauxel",
    image: null,
    alt: "Sanierter Balkon mit neuem Fliesenbelag in Castrop-Rauxel",
  },
  {
    id: "ref-08",
    category: "Naturstein",
    title: "Schiefer-Wandverkleidung",
    location: "Herne",
    image: null,
    alt: "Wandverkleidung aus Schiefer-Naturstein in Herne",
  },
];
