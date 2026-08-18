import { Phone, ClipboardCheck, Star, ShieldCheck, Clock3 } from 'lucide-react';
import { COMPANY } from '../data.js';

// Hinweis SEO: In einer echten Produktions-App würden Title/Meta-Description
// und das LocalBusiness-Schema serverseitig bzw. im Build-Prozess ins
// <head> gerendert (siehe index.jsx für die Demo-Umsetzung per useEffect).

export default function Hero({ onOpenBooking }) {
  return (
    <section id="top" className="relative overflow-hidden bg-sand-50 dark:bg-ink-950">
      {/* Dekorativer Hintergrund: warmes Gradient + feines Punktraster statt Stock-Fotos */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-clay-300/30 blur-3xl dark:bg-clay-700/20" />
        <div className="absolute bottom-[-14rem] left-[-8%] h-[28rem] w-[28rem] rounded-full bg-moss-400/20 blur-3xl dark:bg-moss-600/10" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            color: '#8B5E34',
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-clay-500/25 bg-clay-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            <ShieldCheck size={14} /> Handwerksbetrieb aus München
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 dark:text-sand-50 sm:text-5xl lg:text-[3.4rem]">
            {COMPANY.slogan.split('–')[0]}
            <span className="block text-clay-500">Fair &amp; Kompetent.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600 dark:text-ink-200">
            Von der Terrasse über die Sanierung bis zur Pflasterarbeit: Wir übernehmen Ihr
            Projekt in und um München – termintreu, transparent kalkuliert und mit
            handwerklicher Sorgfalt bis ins Detail.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={COMPANY.phoneHref1}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-6 py-3.5 text-base font-semibold text-sand-50 shadow-soft transition-transform hover:scale-[1.02] hover:bg-clay-600 active:scale-95"
            >
              <Phone size={18} /> Jetzt anrufen
            </a>
            <a
              href="#kontakt"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink-800/15 bg-transparent px-6 py-3.5 text-base font-semibold text-ink-800 transition-colors hover:border-clay-500 hover:text-clay-600 dark:border-sand-100/20 dark:text-sand-50"
            >
              <ClipboardCheck size={18} /> Kostenvoranschlag anfordern
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TrustBadge icon={<Clock3 size={18} />} title="Angebot in 24h" subtitle="Schnelle Rückmeldung" />
            <TrustBadge icon={<ShieldCheck size={18} />} title="Festpreisgarantie" subtitle="Keine Überraschungen" />
            <TrustBadge
              icon={<Star size={18} className="fill-clay-500 text-clay-500" />}
              title="4,8 / 5 Sterne"
              subtitle="Beispielbewertung"
            />
          </dl>
        </div>

        <div className="relative animate-fade-in [animation-delay:200ms]">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-800/8 bg-white/60 p-3.5 shadow-card backdrop-blur dark:border-sand-100/10 dark:bg-ink-900/60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-500/10 text-clay-600 dark:text-clay-300">
        {icon}
      </div>
      <div>
        <dt className="text-sm font-semibold text-ink-900 dark:text-sand-50">{title}</dt>
        <dd className="text-xs text-ink-400 dark:text-ink-200">{subtitle}</dd>
      </div>
    </div>
  );
}

// Reines CSS/SVG "Holz & Werkzeug"-Sujet statt Stock-Foto – hält die Demo
// leichtgewichtig und ist 1:1 durch ein echtes Projektfoto ersetzbar.
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-clay-500 via-clay-600 to-ink-800 shadow-soft" />
      <div
        className="absolute inset-0 rounded-[2rem] opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 14px)',
        }}
      />
      <div className="absolute inset-4 flex flex-col justify-between rounded-[1.5rem] border border-white/15 p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Beispielprojekt
          </span>
          <div className="flex h-11 w-11 animate-float items-center justify-center rounded-full bg-white/90 text-clay-600 shadow-lg">
            <Star size={18} className="fill-clay-500 text-clay-500" />
          </div>
        </div>
        <div className="rounded-2xl bg-ink-950/40 p-5 backdrop-blur">
          <p className="text-sm font-medium text-white/90">„Termintreu, sauber gearbeitet, fair im Preis.“</p>
          <p className="mt-2 text-xs text-white/60">Beispiel-Kundenstimme · München</p>
        </div>
      </div>
    </div>
  );
}
