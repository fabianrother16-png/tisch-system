import Icon from './Icon.jsx';
import Reveal from './Reveal.jsx';
import { useReveal, useCountUp } from '../hooks.js';
import { TRUST_POINTS } from '../data.js';

const STATS = [
  { value: 12, suffix: '+', label: 'Jahre Erfahrung' },
  { value: 240, suffix: '+', label: 'Abgeschlossene Projekte' },
  { value: 24, suffix: 'h', label: 'Angebot in der Regel' },
  { value: 98, suffix: '%', label: 'Termine eingehalten' },
];

export default function WhyUs() {
  const [statsRef, statsVisible] = useReveal();

  return (
    <section id="warum-wir" className="bg-sand-100 py-20 dark:bg-ink-950 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            Warum Johannes-Handwerk
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-sand-50 sm:text-4xl">
            Handwerk, dem Sie vertrauen können
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 90}>
              <div className="h-full rounded-2xl bg-white p-6 text-center shadow-card dark:bg-ink-800">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss-500/10 text-moss-600 dark:text-moss-400">
                  <Icon name={point.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-ink-900 dark:text-sand-50">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
                  {point.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div
          ref={statsRef}
          className="mt-16 grid grid-cols-2 gap-6 rounded-3xl bg-ink-900 px-6 py-10 text-center shadow-soft dark:bg-ink-800 sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <StatCounter key={stat.label} {...stat} active={statsVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCounter({ value, suffix, label, active }) {
  const count = useCountUp(value, active);
  return (
    <div>
      <div className="font-display text-3xl font-extrabold text-sand-50 sm:text-4xl">
        {count}
        {suffix}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-sand-200/70">{label}</div>
    </div>
  );
}
