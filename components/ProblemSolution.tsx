import { X, Check } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { PROBLEM_POINTS, SOLUTION_POINTS } from "@/lib/constants";

export function ProblemSolution() {
  return (
    <section className="bg-cream py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="Die Lage"
          align="center"
          title="Gute Arbeit, die online untergeht?"
          description="Das ist kein Einzelfall – und meistens liegt es an denselben drei Dingen."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Reveal variant="left">
            <div className="h-full rounded-3xl border border-anthracite/10 bg-cream-dark/40 p-8 sm:p-10">
              <span className="eyebrow text-anthracite/65">Die Ausgangslage</span>
              <ul className="mt-6 space-y-5">
                {PROBLEM_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-anthracite/10">
                      <X className="h-3.5 w-3.5 text-anthracite/60" strokeWidth={2.5} />
                    </span>
                    <span className="text-base leading-relaxed text-anthracite/70">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal variant="right" delay={0.1}>
            <div className="h-full rounded-3xl bg-anthracite p-8 sm:p-10">
              <span className="eyebrow text-terracotta-light">Unsere Lösung</span>
              <ul className="mt-6 space-y-5">
                {SOLUTION_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/20">
                      <Check className="h-3.5 w-3.5 text-terracotta-light" strokeWidth={2.5} />
                    </span>
                    <span className="text-base leading-relaxed text-cream/80">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
