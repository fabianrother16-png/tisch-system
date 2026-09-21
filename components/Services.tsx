import {
  Star,
  MapPin,
  Nfc,
  Globe,
  Share2,
  Megaphone,
  TrendingUp,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { SERVICES, type Service } from "@/lib/constants";

const ICONS: Record<Service["icon"], LucideIcon> = {
  star: Star,
  profile: MapPin,
  nfc: Nfc,
  website: Globe,
  social: Share2,
  ads: Megaphone,
  seo: TrendingUp,
  camera: Camera,
};

export function Services() {
  return (
    <section id="leistungen" className="relative bg-cream py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="Leistungen"
          title={
            <>
              Alles, was eure
              <br />
              Sichtbarkeit braucht.
            </>
          }
          description="Von der ersten Google-Bewertung bis zur laufenden Kampagne – acht Bausteine, die einzeln stark und gemeinsam unschlagbar sind."
        />

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-anthracite/10 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => {
            const Icon = ICONS[service.icon];
            return (
              <Reveal key={service.id} delay={(i % 4) * 0.06}>
                <div className="group relative flex h-full flex-col justify-between bg-cream p-8 transition-colors duration-300 hover:bg-anthracite">
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-sm text-anthracite/40 transition-colors group-hover:text-cream/40">
                      {service.number}
                    </span>
                    <Icon
                      className="h-6 w-6 text-terracotta transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="mt-10">
                    <h3 className="font-serif text-xl font-semibold leading-snug text-anthracite transition-colors group-hover:text-cream">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-anthracite/65 transition-colors group-hover:text-cream/70">
                      {service.description}
                    </p>
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
