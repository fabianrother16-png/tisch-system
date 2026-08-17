import {
  PenTool,
  LayoutGrid,
  Sun,
  Droplets,
  Accessibility,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import { services } from "@/lib/content";

// Ordnet die Icon-Namen aus lib/content.ts den lucide-react-Komponenten zu.
// Neues Icon gewünscht? Hier importieren und eintragen.
const iconMap: Record<string, LucideIcon> = {
  PenTool,
  LayoutGrid,
  Sun,
  Droplets,
  Accessibility,
  Mountain,
};

export default function Services() {
  return (
    <section id="leistungen" className="section-padding bg-sand-50">
      <div className="container-content">
        <div className="max-w-xl">
          <p className="eyebrow">Unsere Leistungen</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
            Alles aus einer Hand – von der Idee bis zur Fuge
          </h2>
          <p className="mt-4 text-base leading-relaxed text-charcoal-light">
            Sechs Leistungsbereiche, ein Anspruch: sauber geplant und präzise
            verlegt.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon] ?? PenTool;
            return (
              <div
                key={service.id}
                className="group relative flex flex-col rounded-xl2 border border-charcoal/5 bg-white p-7 shadow-card transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-500 transition-colors group-hover:bg-terracotta-500 group-hover:text-white">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-charcoal">
                  {service.title}
                </h3>
                <p className="mt-1.5 text-sm font-medium text-slate-500">
                  {service.short}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-light">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
