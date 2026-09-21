import { Camera, Plane } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { USPS } from "@/lib/constants";

export function WhyUs() {
  return (
    <section id="warum-wir" className="relative overflow-hidden bg-anthracite py-28 text-cream md:py-36">
      <div className="grain-overlay pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true" />
      <Container className="relative">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <SectionHeading
                eyebrow="Warum wir"
                tone="light"
                title={
                  <>
                    Wir liefern das
                    <br />
                    Material <span className="italic text-terracotta">selbst</span>.
                  </>
                }
                description="Keine Stock-Fotos, kein generischer Content von der Stange. Unser Team ist mit Drohne und POV-Kamera vor Ort – für Bilder, die wirklich nach euch aussehen."
              />

              <div className="mt-10 flex gap-4">
                <div className="flex h-24 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-cream/15 bg-cream/5">
                  <Plane className="h-5 w-5 text-terracotta-light" strokeWidth={1.75} />
                  <span className="font-sans text-xs uppercase tracking-[0.15em] text-cream/60">
                    Drohne
                  </span>
                </div>
                <div className="flex h-24 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-cream/15 bg-cream/5">
                  <Camera className="h-5 w-5 text-terracotta-light" strokeWidth={1.75} />
                  <span className="font-sans text-xs uppercase tracking-[0.15em] text-cream/60">
                    POV-Kamera
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="divide-y divide-cream/10 border-y border-cream/10">
              {USPS.map((usp, i) => (
                <Reveal key={usp.number} delay={i * 0.08} variant="right">
                  <div className="group grid grid-cols-[auto,1fr] gap-6 py-9 md:gap-10">
                    <span className="font-serif text-2xl text-terracotta-light/80 transition-colors group-hover:text-terracotta-light">
                      {usp.number}
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl font-semibold leading-snug md:text-3xl">
                        {usp.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-base leading-relaxed text-cream/65">
                        {usp.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
