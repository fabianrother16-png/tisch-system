import { Play, PlaneTakeoff } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { SHOWCASE_ITEMS } from "@/lib/constants";

type ShowcaseItem = (typeof SHOWCASE_ITEMS)[number];

const SPAN: Record<string, string> = {
  large: "sm:col-span-2 sm:row-span-2",
  medium: "sm:col-span-2 sm:row-span-1",
  small: "sm:col-span-1 sm:row-span-1",
};

const BASE_GRADIENT: Record<ShowcaseItem["pattern"], string> = {
  aerial: "bg-gradient-to-br from-anthracite-light via-anthracite to-terracotta-dark/70",
  bokeh: "bg-gradient-to-br from-terracotta-dark/90 via-anthracite to-anthracite",
  motion: "bg-gradient-to-tr from-anthracite via-anthracite-light to-terracotta-dark/60",
  lens: "bg-gradient-to-b from-anthracite via-anthracite-light to-anthracite",
};

// Editorielle Platzhalter-Grafik pro Kategorie. Sobald echtes Foto-/Videomaterial
// vorliegt: diese Fläche durch <Image src="..." fill className="object-cover" />
// (next/image) ersetzen. `item.query` je Kachel ist der empfohlene Recherche-
// Suchbegriff für lizenzfreies Unsplash-/Pexels-Material als Zwischenlösung.
// TODO: durch eigenes Drohnen-/POV-Material ersetzen.
function PlaceholderArt({ pattern }: { pattern: ShowcaseItem["pattern"] }) {
  if (pattern === "aerial") {
    return (
      <>
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(#F5F1E8 1px, transparent 1px), linear-gradient(90deg, #F5F1E8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(30,26,23,0.6)_100%)]"
          aria-hidden="true"
        />
      </>
    );
  }

  if (pattern === "bokeh") {
    return (
      <>
        <div className="absolute -left-6 top-1/4 h-24 w-24 rounded-full bg-terracotta-light/40 blur-2xl" aria-hidden="true" />
        <div className="absolute right-8 top-8 h-16 w-16 rounded-full bg-cream/25 blur-2xl" aria-hidden="true" />
        <div className="absolute bottom-6 left-1/3 h-20 w-20 rounded-full bg-terracotta/40 blur-2xl" aria-hidden="true" />
      </>
    );
  }

  if (pattern === "motion") {
    return (
      <div className="absolute inset-0 flex -rotate-12 items-center justify-center gap-3 opacity-30" aria-hidden="true">
        <div className="h-[140%] w-3 rounded-full bg-cream/50 blur-sm" />
        <div className="h-[140%] w-2 rounded-full bg-terracotta-light/60 blur-sm" />
        <div className="h-[140%] w-4 rounded-full bg-cream/30 blur-md" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute rounded-full border border-cream/20"
          style={{ width: `${ring * 90}px`, height: `${ring * 90}px` }}
        />
      ))}
    </div>
  );
}

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
            <Reveal key={item.id} delay={(i % 4) * 0.06} variant="scale" className={SPAN[item.size]}>
              <div className="group relative h-full w-full overflow-hidden rounded-2xl">
                <div
                  className={`absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110 ${BASE_GRADIENT[item.pattern]}`}
                >
                  <PlaceholderArt pattern={item.pattern} />
                  <div className="grain-overlay absolute inset-0 opacity-[0.12]" aria-hidden="true" />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-anthracite/70 via-transparent to-anthracite/20" aria-hidden="true" />

                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/70">
                      {item.label}
                    </span>
                    {item.type === "photo" ? (
                      <PlaneTakeoff className="h-4 w-4 text-cream/60" strokeWidth={1.75} />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-terracotta-light/90">
                        <Play className="ml-0.5 h-3.5 w-3.5 text-cream" fill="currentColor" strokeWidth={0} />
                      </span>
                    )}
                  </div>
                  <span className="font-serif text-lg text-cream drop-shadow-sm">{item.tag}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
