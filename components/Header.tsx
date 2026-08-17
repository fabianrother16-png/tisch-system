"use client";

import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { company } from "@/lib/content";

const navItems = [
  { href: "#leistungen", label: "Leistungen" },
  { href: "#referenzen", label: "Referenzen" },
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#kontakt", label: "Kontakt" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menü nach Klick auf einen Link automatisch schließen (mobile)
  const closeMenu = () => setMenuOpen(false);

  // Solange die Seite ganz oben ist, liegt der Header transparent über dem
  // dunklen Hero-Bereich -> helle Schrift. Sobald gescrollt wird, bekommt der
  // Header einen hellen Hintergrund -> dunkle Schrift für genug Kontrast.
  const isLight = !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-sand-50/90 shadow-card backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="container-content flex h-[72px] items-center justify-between py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-500">
            <span className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
          </span>
          <span
            className={`font-display text-lg font-semibold leading-none transition-colors ${
              isLight ? "text-white" : "text-charcoal"
            }`}
          >
            {company.name}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-terracotta-400 ${
                isLight ? "text-white/90" : "text-charcoal-light"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={company.phoneHref}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors hover:text-terracotta-400 ${
              isLight ? "text-white/90" : "text-slate-700"
            }`}
          >
            <Phone size={16} />
            {company.phone}
          </a>
          <a href="#kontakt" className="btn-primary">
            Beratung anfragen
          </a>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden ${
            isLight ? "text-white" : "text-charcoal"
          }`}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile-Menü */}
      {menuOpen && (
        <div className="border-t border-charcoal/10 bg-sand-50 md:hidden">
          <nav className="container-content flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-lg px-2 py-3 text-base font-medium text-charcoal-light hover:bg-sand-200"
              >
                {item.label}
              </a>
            ))}
            <a
              href={company.phoneHref}
              onClick={closeMenu}
              className="flex items-center gap-2 rounded-lg px-2 py-3 text-base font-semibold text-slate-700"
            >
              <Phone size={17} />
              {company.phone}
            </a>
            <a
              href="#kontakt"
              onClick={closeMenu}
              className="btn-primary mt-2 w-full"
            >
              Beratung anfragen
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
