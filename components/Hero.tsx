"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Container } from "./ui/Container";
import { MagneticButtonLink } from "./ui/MagneticButton";
import { LogoMark } from "./Logo";
import { SITE } from "@/lib/constants";

const wordContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.5 },
  },
};

const wordReveal = {
  hidden: { y: "110%", rotate: 4 },
  visible: {
    y: "0%",
    rotate: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function KineticWord({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
      <motion.span
        variants={wordReveal}
        className={`inline-block ${accent ? "italic text-terracotta" : ""}`}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const watermarkRotate = useTransform(scrollYProgress, [0, 1], [-16, -4]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-anthracite pt-28"
    >
      {/*
        Platzhalter für Video-Loop-Hintergrund (Drohnenaufnahme):
        Sobald Footage vorliegt, hier ein <video autoPlay muted loop playsInline
        poster="/hero-poster.jpg" className="absolute inset-0 h-full w-full object-cover">
        einfügen und die Opacity des Gradient-Overlays ggf. auf 0.5 erhöhen.
      */}
      <div className="grain-overlay pointer-events-none absolute inset-0 z-[1] opacity-[0.1]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(193,80,46,0.22),transparent_55%)]"
        aria-hidden="true"
      />

      <motion.div
        style={{ y: watermarkY, rotate: watermarkRotate }}
        className="pointer-events-none absolute -right-24 -top-24 opacity-[0.07] sm:-right-16 sm:top-1/2 sm:-translate-y-1/2"
        aria-hidden="true"
      >
        <LogoMark className="h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] lg:h-[680px] lg:w-[680px]" />
      </motion.div>

      <motion.div style={{ y: contentY, opacity: contentOpacity }}>
        <Container className="relative z-10">
          <div className="max-w-4xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="eyebrow text-terracotta-light"
            >
              Marketing-Agentur aus {SITE.city}
            </motion.span>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={wordContainer}
              className="mt-6 text-[clamp(3.25rem,10vw,9.5rem)] font-semibold leading-[0.94] tracking-tightest text-cream"
            >
              <span className="block">
                <KineticWord>Digitale</KineticWord>{" "}
                <KineticWord>Sichtbarkeit</KineticWord>
              </span>
              <span className="block">
                <KineticWord>für</KineticWord> <KineticWord>den</KineticWord>{" "}
                <KineticWord accent>Mittelstand.</KineticWord>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.3 }}
              className="mt-8 max-w-xl text-lg leading-relaxed text-cream/75 md:text-xl"
            >
              Wir bringen mittelständische Unternehmen und Restaurants online nach
              vorn – mit Strategie, Kampagnen und eigens produziertem Drohnen- und
              POV-Content direkt vor Ort.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.45 }}
              className="mt-10 flex flex-wrap items-center gap-5"
            >
              <MagneticButtonLink href="#kontakt" variant="primary">
                Kostenloses Erstgespräch
              </MagneticButtonLink>
              <a
                href="#leistungen"
                className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-cream/70 underline decoration-cream/30 underline-offset-8 transition-colors hover:text-cream hover:decoration-terracotta"
              >
                Leistungen ansehen
              </a>
            </motion.div>
          </div>
        </Container>
      </motion.div>

      <motion.a
        href="#leistungen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream/50 transition-colors hover:text-cream sm:flex"
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
