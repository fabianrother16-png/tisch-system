import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { company } from "@/lib/content";
import ChatWidget from "@/components/ChatWidget";

// -----------------------------------------------------------------------
// Schriften: Fraunces (warme Serife für Headlines) + Inter (klarer Sans für
// Fließtext). Über CSS-Variablen an Tailwind angebunden (siehe tailwind.config.ts)
// -----------------------------------------------------------------------
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const title = `${company.name} – Fliesenleger in Dortmund | ${company.claim}`;
const description =
  "Fliesen Khalil aus Dortmund: Fliesen, Naturstein & barrierefreie Bäder – fachgerecht verlegt. " +
  "Konzeptentwicklung, Balkone & Terrassen, Silikonversiegelung. Kostenlose Beratung anfragen.";

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  title: {
    default: title,
    template: `%s | ${company.name}`,
  },
  description,
  keywords: [
    "Fliesenleger Dortmund",
    "Fliesen verlegen Dortmund",
    "Naturstein Dortmund",
    "Barrierefreies Bad Dortmund",
    "Badsanierung Dortmund",
    "Terrassenfliesen",
    "Fliesen Khalil",
  ],
  authors: [{ name: company.name }],
  creator: company.name,
  applicationName: company.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: company.url,
    siteName: company.name,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#C1622D",
  width: "device-width",
  initialScale: 1,
};

// Strukturierte Daten (schema.org) für ein lokales Handwerksunternehmen.
// Hilft Google & Co., Firmendaten (Adresse, Öffnungszeiten, Kontakt) korrekt
// als "Local Business" darzustellen (z.B. im Wissenspanel / Maps).
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${company.url}/#organization`,
    name: company.name,
    slogan: company.claim,
    description,
    url: company.url,
    telephone: company.phoneHref.replace("tel:", ""),
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      postalCode: company.address.zip,
      addressLocality: company.address.city,
      addressCountry: company.address.country,
    },
    areaServed: company.serviceArea,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    priceRange: "€€",
    knowsAbout: [
      "Fliesenverlegung",
      "Natursteinverlegung",
      "Badsanierung",
      "Barrierefreies Bauen",
      "Silikonversiegelung",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <StructuredData />
      </head>
      <body className="font-sans">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
