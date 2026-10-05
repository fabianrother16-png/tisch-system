import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";

// next/font lädt die Schriften beim Build und liefert sie selbst aus (kein Google-Request im Browser).
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans", display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "SICHTWERK Studio", template: "%s · SICHTWERK Studio" },
  description: "Internes Agentur-Werkzeug von SICHTWERK",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1E1A17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${fraunces.variable} ${workSans.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
