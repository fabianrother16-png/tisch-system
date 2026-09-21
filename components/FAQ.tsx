"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { FAQ_ITEMS } from "@/lib/constants";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-cream py-28 md:py-36">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Häufige Fragen"
              title="Noch etwas unklar?"
              description="Die Antworten auf das, was uns Betriebe am häufigsten fragen."
            />
          </div>

          <div className="lg:col-span-8">
            <div className="divide-y divide-anthracite/10 border-y border-anthracite/10">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = openIndex === i;
                const panelId = `faq-panel-${i}`;
                const buttonId = `faq-button-${i}`;

                return (
                  <Reveal key={item.question} delay={i * 0.05}>
                    <div>
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => setOpenIndex(isOpen ? null : i)}
                          className="flex w-full items-center justify-between gap-6 py-6 text-left font-serif text-xl font-semibold text-anthracite transition-colors hover:text-terracotta-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
                        >
                          {item.question}
                          <motion.span
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-anthracite/5 text-anthracite"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                          </motion.span>
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="max-w-2xl pb-6 text-base leading-relaxed text-anthracite/70">
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
