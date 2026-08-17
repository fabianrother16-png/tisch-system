import { ShieldCheck, Ruler, Smile, Tag } from "lucide-react";
import { values, partners, company } from "@/lib/content";

const valueIcons = [ShieldCheck, Ruler, Smile, Tag];

export default function About() {
  return (
    <section id="ueber-uns" className="section-padding bg-slate-700 text-white">
      <div className="container-content">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow text-terracotta-300">Über uns</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Handwerk, auf das Sie sich verlassen können
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-100/85">
              {company.name} steht für ehrliches Handwerk aus Dortmund. Wir
              begleiten Sie von der ersten Beratung über die Materialwahl bis
              zur letzten Fuge – termintreu, sauber und zu einem Preis, der
              von Anfang an feststeht.
            </p>

            <div className="mt-8 rounded-xl2 border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                In Zusammenarbeit mit
              </p>
              <ul className="mt-4 space-y-3">
                {partners.map((partner) => (
                  <li key={partner.name}>
                    <p className="font-display text-base font-semibold text-white">
                      {partner.name}
                    </p>
                    <p className="text-sm text-slate-300">
                      {partner.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {values.map((value, i) => {
              const Icon = valueIcons[i % valueIcons.length];
              return (
                <div
                  key={value.title}
                  className="rounded-xl2 bg-white/5 p-6 backdrop-blur-sm ring-1 ring-white/10"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta-500/20 text-terracotta-300">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200/85">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
