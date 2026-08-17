import { ArrowRight, Phone } from "lucide-react";
import { company, partners } from "@/lib/content";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-slate-700 pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Dezentes Fliesenraster als Hintergrundtextur */}
      <div className="tile-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-terracotta-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-slate-400/20 blur-3xl"
        aria-hidden
      />

      <div className="container-content relative">
        <div className="max-w-2xl">
          <p className="eyebrow text-terracotta-300">
            {company.founderTitle}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Fliesen &amp; Naturstein, verlegt mit Präzision.
          </h1>
          <p className="mt-6 font-display text-xl italic text-terracotta-200 sm:text-2xl">
            „{company.claim}“
          </p>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-100/90 sm:text-lg">
            Ob Badezimmer, Wohnboden, Terrasse oder Naturstein-Arbeitsplatte –
            wir planen und verlegen für Sie in und um Dortmund. Handwerklich
            sauber, ehrlich beraten, zu einem fairen Festpreis.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#kontakt" className="btn-primary">
              Kostenlose Beratung anfordern
              <ArrowRight size={16} />
            </a>
            <a
              href="#referenzen"
              className="btn-secondary bg-white/10 text-white hover:bg-white/20"
            >
              Referenzen ansehen
            </a>
          </div>

          <a
            href={company.phoneHref}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-100/80 hover:text-white"
          >
            <Phone size={16} />
            Oder direkt anrufen: {company.phone}
          </a>
        </div>

        {/* Partner-/Vertrauensleiste */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            Verarbeitet Materialien &amp; Systeme von
          </p>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {partners.map((partner) => (
              <span
                key={partner.name}
                className="font-display text-lg font-medium text-slate-100/90"
                title={partner.description}
              >
                {partner.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
