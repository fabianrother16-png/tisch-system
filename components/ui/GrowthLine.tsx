"use client";

import { motion } from "framer-motion";

// Rein illustrative Wachstumslinie ohne konkrete Zahlen/Prozentwerte – zeigt
// nur die Richtung ("mehr Sichtbarkeit über Zeit"), keine echte Kennzahl.
export function GrowthLine({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-cream/15 bg-cream/5 p-5 ${className}`}>
      <div className="flex items-center justify-between font-sans text-[10px] uppercase tracking-[0.15em] text-cream/50">
        <span>Start</span>
        <span>Sichtbarkeit</span>
      </div>
      <svg viewBox="0 0 200 60" className="mt-3 h-14 w-full" fill="none" aria-hidden="true">
        <motion.path
          d="M4 50 C 40 52, 60 40, 90 32 S 140 14, 196 6"
          stroke="#D97350"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}
