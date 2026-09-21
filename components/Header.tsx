"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./ui/Container";
import { ButtonLink } from "./ui/Button";
import { MagneticButtonLink } from "./ui/MagneticButton";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>(NAV_LINKS[0].href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.querySelector(link.href)).filter(
      (el): el is Element => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHref(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-anthracite/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(245,241,232,0.08)]"
          : "bg-transparent"
      }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <a
          href="#top"
          className="text-cream transition-opacity hover:opacity-80"
          aria-label="SICHTWERK Startseite"
        >
          <Logo />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Hauptnavigation">
          {NAV_LINKS.map((link) => {
            const isActive = activeHref === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center gap-1.5 font-sans text-sm font-medium transition-colors"
              >
                <span
                  className={`font-sans text-[10px] tabular-nums transition-colors ${
                    isActive ? "text-terracotta-light" : "text-cream/50 group-hover:text-terracotta-light"
                  }`}
                >
                  {link.number}
                </span>
                <span
                  className={
                    isActive
                      ? "text-cream"
                      : "text-cream/80 transition-colors group-hover:text-terracotta-light"
                  }
                >
                  {link.label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <MagneticButtonLink href="#kontakt" variant="primary" className="px-6 py-3 text-xs">
            Erstgespräch
          </MagneticButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-cream lg:hidden"
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-anthracite lg:hidden"
          >
            <Container className="flex flex-col gap-1 pb-8 pt-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 border-b border-cream/10 py-4 font-serif text-2xl text-cream"
                >
                  <span className="font-sans text-xs text-terracotta-light">{link.number}</span>
                  {link.label}
                </a>
              ))}
              <ButtonLink
                href="#kontakt"
                variant="primary"
                onClick={() => setMenuOpen(false)}
                className="mt-6 w-full"
              >
                Kostenloses Erstgespräch
              </ButtonLink>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
