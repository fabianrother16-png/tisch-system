import { Star } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { TESTIMONIALS } from "@/lib/constants";

// Diese Sektion ist strukturell fertig, zeigt aber bewusst nichts an, solange
// TESTIMONIALS (lib/constants.ts) leer ist – wir erfinden keine Kundenstimmen.
// Sobald echte Google-Bewertungen vorliegen: Einträge in TESTIMONIALS
// ergänzen, die Sektion erscheint dann automatisch.
export function Testimonials() {
  if (TESTIMONIALS.length === 0) {
    return null;
  }

  return (
    <section className="bg-cream py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="Kundenstimmen"
          align="center"
          title="Was unsere Kunden sagen."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08} variant="scale">
              <div className="flex h-full flex-col justify-between rounded-3xl border border-anthracite/10 bg-cream p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star < t.rating
                              ? "fill-terracotta text-terracotta"
                              : "text-anthracite/50"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-anthracite/65">
                      Google Bewertung
                    </span>
                  </div>
                  <p className="mt-5 font-serif text-lg leading-relaxed text-anthracite/85">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 border-t border-anthracite/10 pt-4">
                  <p className="font-sans text-sm font-semibold text-anthracite">{t.name}</p>
                  <p className="font-sans text-xs text-anthracite/55">
                    {t.role} · {t.location}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
