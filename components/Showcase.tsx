import { Play, PlaneTakeoff } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { SHOWCASE_ITEMS } from "@/lib/constants";

const SPAN: Record<string, string> = {
  large: "sm:col-span-2 sm:row-span-2",
  medium: "sm:col-span-2 sm:row-span-1",
  small: "sm:col-span-1 sm:row-span-1",
};

const GRADIENTS = [
  "from-terracotta/90 via-anthracite to-anthracite",
  "from-anthracite via-anthracite to-terracotta-dark/80",
  "from-anthracite-light via-anthracite to-anthracite",
  "from-terracotta-dark/80 via-anthracite to-anthracite-light",
];

export function Showcase() {
  return (
    <section id="showcase" className="bg-cream py-28 md:py-36">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Showcase"
            title={
              <>
                Aus der Luft.
                <br />
                Aus der Perspektive.
              </>
            }
            description="Eine Auswahl unserer Foto- und Videoproduktionen entsteht hier bald – kuratiert aus echten Drohnen- und POV-Einsätzen bei unseren Kunden."
          />
        </div>

        <div className="mt-16 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] sm:grid-cols-4">
          {SHOWCASE_ITEMS.map((item, i) => (
            <Reveal key={item.id} delay={(i % 4) * 0.06} className={SPAN[item.size]}>
              <div
                className={`group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-6 ${
                  GRADIENTS[i % GRADIENTS.length]
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, #F5F1E8 0px, #F5F1E8 1px, transparent 1px, transparent 14px)",
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/60">
                    {item.label}
                  </span>
                  {item.label.startsWith("Drohnen") ? (
                    <PlaneTakeoff className="h-4 w-4 text-cream/50" strokeWidth={1.75} />
                  ) : (
                    <Play className="h-4 w-4 text-cream/50" strokeWidth={1.75} />
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cream/30 text-cream/70 transition-transform duration-300 group-hover:scale-110 group-hover:border-terracotta-light group-hover:text-terracotta-light">
                    <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} />
                  </span>
                </div>
                <span className="font-serif text-lg text-cream">{item.tag}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
