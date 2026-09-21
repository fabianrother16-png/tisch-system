import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { PROCESS_STEPS } from "@/lib/constants";

export function Process() {
  return (
    <section id="ablauf" className="bg-anthracite py-28 text-cream md:py-36">
      <Container>
        <SectionHeading
          eyebrow="Ablauf"
          tone="light"
          align="center"
          title="So läuft eine Zusammenarbeit ab."
          description="Vier Schritte, klar strukturiert – vom ersten Gespräch bis zum sichtbaren Wachstum."
        />

        <div className="relative mt-20 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-4">
          <div
            className="absolute left-0 right-0 top-6 hidden h-px bg-cream/15 md:block"
            aria-hidden="true"
          />
          {PROCESS_STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.1} className="relative">
              <div className="flex items-center gap-4 md:block">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-dark font-serif text-lg font-semibold text-cream md:mb-6">
                  {step.number}
                </span>
                <h3 className="font-serif text-xl font-semibold md:mt-0">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-base leading-relaxed text-cream/65 md:mt-3">
                {step.description}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
