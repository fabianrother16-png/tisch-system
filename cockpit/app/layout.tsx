import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/* Dieselben Schriften wie die Website (beim Build heruntergeladen und selbst gehostet). */
const text = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--ff-text", display: "swap" });
const titel = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--ff-titel", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Rother Marketing Cockpit", template: "%s · Rother Marketing Cockpit" },
  description: "Agentur-Software für Kunden, Content, Performance und Buchhaltung.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#12100d" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`${text.variable} ${titel.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans text-[14.5px] antialiased">{children}</body>
    </html>
  );
}
