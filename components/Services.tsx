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
import { MagneticButtonLink } from "./ui/MagneticButton";
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

// Kuratierte Bento-Reihenfolge: "Website" und "Foto & Video" sind unsere
// stärksten Differenzierer und bekommen bewusst mehr Fläche.
const BENTO_LAYOUT: Array<{ id: string; span: 1 | 2 }> = [
  { id: "rezensionsmanagement", span: 1 },
  { id: "google-unternehmensprofil", span: 1 },
  { id: "website", span: 2 },
  { id: "foto-video", span: 2 },
  { id: "nfc-bewertungskarten", span: 1 },
  { id: "social-media", span: 1 },
  { id: "meta-ads", span: 1 },
  { id: "seo-optimierung", span: 1 },
];

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
          {BENTO_LAYOUT.map(({ id, span }, i) => {
            const service = SERVICES.find((s) => s.id === id)!;
            const Icon = ICONS[service.icon];
            const big = span === 2;

            return (
              <Reveal
                key={service.id}
                delay={(i % 4) * 0.06}
                variant="scale"
                className={big ? "sm:col-span-2" : ""}
              >
                <div
                  className={`group relative flex h-full flex-col justify-between overflow-hidden bg-cream p-8 transition-colors duration-300 hover:bg-anthracite ${
                    big ? "min-h-[220px] p-9 sm:min-h-[260px]" : "min-h-[220px]"
                  }`}
                >
                  {big && (
                    <Icon
                      className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 text-anthracite/[0.05] transition-colors duration-300 group-hover:text-cream/[0.06]"
                      strokeWidth={1}
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative flex items-start justify-between">
                    <span className="font-serif text-sm text-anthracite/40 transition-colors group-hover:text-cream/40">
                      {service.number}
                    </span>
                    <Icon
                      className={`text-terracotta transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                        big ? "h-8 w-8" : "h-6 w-6"
                      }`}
                      strokeWidth={1.75}
                    />
                  </div>

                  <div className="relative mt-10">
                    <h3
                      className={`font-serif font-semibold leading-snug text-anthracite transition-colors group-hover:text-cream ${
                        big ? "text-2xl sm:text-3xl" : "text-xl"
                      }`}
                    >
                      {service.title}
                    </h3>
                    <p
                      className={`mt-3 leading-relaxed text-anthracite/65 transition-colors group-hover:text-cream/70 ${
                        big ? "max-w-sm text-base" : "text-sm"
                      }`}
                    >
                      {service.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}

          <Reveal delay={0.36} variant="scale" className="sm:col-span-2">
            <div className="flex h-full min-h-[220px] flex-col items-start justify-between bg-terracotta-dark p-9 sm:min-h-[260px]">
              <span className="eyebrow text-cream/90">Und jetzt?</span>
              <div>
                <h3 className="font-serif text-2xl font-semibold leading-snug text-cream sm:text-3xl">
                  Lass uns besprechen, was für euch passt.
                </h3>
                <div className="mt-6">
                  <MagneticButtonLink href="#kontakt" variant="light">
                    Erstgespräch vereinbaren
                  </MagneticButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
