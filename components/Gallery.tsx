"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, MapPin } from "lucide-react";
import { galleryCategories, galleryItems, type GalleryCategory } from "@/lib/content";

export default function Gallery() {
  const [active, setActive] = useState<GalleryCategory>("Alle");

  const filtered =
    active === "Alle"
      ? galleryItems
      : galleryItems.filter((item) => item.category === active);

  return (
    <section id="referenzen" className="section-padding bg-sand-100">
      <div className="container-content">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="eyebrow">Referenzprojekte</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
              Einblicke in unsere Arbeit
            </h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal-light">
              Eine Auswahl abgeschlossener Projekte in Dortmund und Umgebung.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {galleryCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === category
                    ? "bg-terracotta-500 text-white"
                    : "bg-white text-charcoal-light hover:bg-terracotta-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <figure
              key={item.id}
              className="group overflow-hidden rounded-xl2 border border-charcoal/5 bg-white shadow-card"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {item.image ? (
                  // Sobald echte Fotos vorliegen, greift dieser Zweig automatisch.
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  // Gestalteter Platzhalter, bis ein echtes Foto eingesetzt wird.
                  // Bild einfach in /public/images/gallery/ ablegen und den Pfad
                  // in lib/content.ts unter `image` eintragen.
                  <div className="tile-pattern flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
                    <ImageOff size={26} strokeWidth={1.5} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Foto folgt
                    </span>
                  </div>
                )}
              </div>
              <figcaption className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-500">
                  {item.category}
                </p>
                <p className="mt-1 font-display text-base font-semibold text-charcoal">
                  {item.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-charcoal-light">
                  <MapPin size={12} />
                  {item.location}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
