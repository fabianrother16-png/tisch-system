import { Calendar, MapPin, Video } from "lucide-react";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { CountUp } from "./ui/CountUp";
import { TRUST_FACTS } from "@/lib/constants";

const ICONS = [Calendar, MapPin, Video];

export function TrustBar() {
  return (
    <section className="border-b border-anthracite/10 bg-cream py-10">
      <Container>
        <div className="grid grid-cols-1 divide-y divide-anthracite/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {TRUST_FACTS.map((fact, i) => {
            const Icon = ICONS[i];
            const year = fact.isYear ? parseInt(fact.value, 10) : null;

            return (
              <Reveal key={fact.label} delay={i * 0.08} className="px-0 py-5 sm:px-8 sm:py-0">
                <div className="flex items-center gap-4">
                  <Icon className="h-6 w-6 shrink-0 text-terracotta" strokeWidth={1.75} />
                  <div>
                    <div className="font-serif text-xl font-semibold text-anthracite sm:text-2xl">
                      {year !== null ? (
                        <CountUp value={year} />
                      ) : (
                        fact.value
                      )}
                    </div>
                    <div className="font-sans text-xs uppercase tracking-[0.15em] text-anthracite/65">
                      {fact.label}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
