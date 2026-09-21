import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { SITE } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} – ${SITE.claim}`,
    template: `%s – ${SITE.name}`,
  },
  description:
    "SICHTWERK ist eine Marketing-Agentur aus Gütersloh für den Mittelstand: Google-Bewertungen, Website, SEO, Social Media, Meta Ads und selbst produzierte Drohnen- & POV-Aufnahmen – alles aus einer Hand.",
  keywords: [
    "Marketing Agentur Gütersloh",
    "Google Bewertungen Management",
    "lokales SEO",
    "Social Media Agentur Mittelstand",
    "Drohnenaufnahmen Marketing",
    "Website für Restaurants",
    "Meta Ads Agentur",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} – ${SITE.claim}`,
    description:
      "Wir machen mittelständische Unternehmen und Restaurants online sichtbar – strategisch geplant und selbst produziert, inklusive Drohnen- und POV-Content.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} – ${SITE.claim}`,
    description:
      "Digitale Sichtbarkeit für den Mittelstand: Bewertungen, Website, SEO, Social Media, Ads und eigens produziertes Foto- & Videomaterial.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    description:
      "Marketing-Agentur für mittelständische Unternehmen und Restaurants: Rezensionsmanagement, Google-Unternehmensprofil, Websites, SEO, Social Media, Meta Ads sowie selbst produzierte Drohnen- und POV-Aufnahmen.",
    url: SITE.url,
    image: `${SITE.url}/opengraph-image`,
    telephone: SITE.phoneHref,
    email: SITE.email,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressCountry: "DE",
    },
    areaServed: {
      "@type": "State",
      name: "Nordrhein-Westfalen",
    },
    sameAs: [],
  };

  return (
    <html lang="de" className={`${fraunces.variable} ${workSans.variable}`}>
      <body className="bg-cream font-sans text-anthracite antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-terracotta focus:px-5 focus:py-3 focus:text-cream focus:outline-none"
        >
          Zum Inhalt springen
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
