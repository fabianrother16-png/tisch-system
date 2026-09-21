"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Container } from "./ui/Container";
import { ButtonLink } from "./ui/Button";
import { SITE } from "@/lib/constants";

const BARS = [
  { height: "34%", delay: 0, opacity: 0.35 },
  { height: "54%", delay: 0.15, opacity: 0.5 },
  { height: "72%", delay: 0.3, opacity: 0.7 },
  { height: "92%", delay: 0.45, opacity: 0.9 },
  { height: "100%", delay: 0.6, opacity: 1 },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-anthracite pt-28"
    >
      {/*
        Platzhalter für Video-Loop-Hintergrund (Drohnenaufnahme):
        Sobald Footage vorliegt, hier ein <video autoPlay muted loop playsInline
        poster="/hero-poster.jpg" className="absolute inset-0 h-full w-full object-cover">
        einfügen und die Opacity des Gradient-Overlays ggf. auf 0.5 erhöhen.
      */}
      <div className="grain-overlay pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(193,80,46,0.22),transparent_55%)]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-10 bottom-0 hidden h-[55%] items-end gap-3 opacity-80 sm:flex sm:h-[65%] sm:gap-5 md:right-8"
        aria-hidden="true"
      >
        {BARS.map((bar, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, delay: bar.delay, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: bar.height, transformOrigin: "bottom", opacity: bar.opacity }}
            className="w-6 origin-bottom rounded-t-sm bg-terracotta sm:w-10 md:w-14"
          />
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: "backOut" }}
          className="absolute -top-6 right-0 text-terracotta sm:-top-8"
        >
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="h-8 w-8 sm:h-10 sm:w-10">
            <path
              d="M24 2L28.5 18.5L45 24L28.5 29.5L24 46L19.5 29.5L3 24L19.5 18.5L24 2Z"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow text-terracotta-light"
          >
            Marketing-Agentur aus {SITE.city}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-[13vw] font-semibold leading-[0.98] tracking-tightest text-cream sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          >
            Digitale Sichtbarkeit
            <br />
            für den <span className="text-terracotta italic">Mittelstand</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-cream/75 md:text-xl"
          >
            Wir bringen mittelständische Unternehmen und Restaurants online nach
            vorn – mit Strategie, Kampagnen und eigens produziertem Drohnen- und
            POV-Content direkt vor Ort.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <ButtonLink href="#kontakt" variant="primary">
              Kostenloses Erstgespräch
            </ButtonLink>
            <a
              href="#leistungen"
              className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-cream/70 underline decoration-cream/30 underline-offset-8 transition-colors hover:text-cream hover:decoration-terracotta"
            >
              Leistungen ansehen
            </a>
          </motion.div>
        </div>
      </Container>

      <motion.a
        href="#leistungen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream/50 transition-colors hover:text-cream sm:flex"
        aria-label="Nach unten scrollen"
      >
        <span className="font-sans text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
