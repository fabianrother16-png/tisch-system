import { MapPin } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { REGIONAL_CITIES, MAPS_EMBED_SRC } from "@/lib/constants";

export function Regional() {
  return (
    <section className="bg-cream-dark/60 py-28 md:py-36">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Regional verwurzelt"
              title="Zuhause in der Region."
              description="Gegründet in Gütersloh, unterwegs in ganz OWL – wir kennen die Wege und die Betriebe hier persönlich."
            />

            <ul className="mt-8 flex flex-wrap gap-3">
              {REGIONAL_CITIES.map((city) => (
                <li
                  key={city}
                  className="flex items-center gap-2 rounded-full border border-anthracite/15 bg-cream px-4 py-2 font-sans text-sm text-anthracite/80"
                >
                  <MapPin className="h-3.5 w-3.5 text-terracotta" strokeWidth={2} />
                  {city}
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-full bg-anthracite px-4 py-2 font-sans text-sm text-cream">
                + gesamte Region OWL
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <Reveal variant="scale">
              <div className="overflow-hidden rounded-3xl border border-anthracite/10">
                <iframe
                  src={MAPS_EMBED_SRC}
                  title="Karte: SICHTWERK-Einsatzgebiet rund um Gütersloh"
                  loading="lazy"
                  className="h-[360px] w-full sm:h-[420px]"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
