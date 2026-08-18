import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import Icon from './Icon.jsx';
import Reveal from './Reveal.jsx';
import { SERVICES } from '../data.js';

export default function Services() {
  const [openId, setOpenId] = useState(null);

  return (
    <section id="leistungen" className="bg-white py-20 dark:bg-ink-900 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            Unsere Leistungen
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-sand-50 sm:text-4xl">
            Vier Bereiche, ein Ansprechpartner
          </h2>
          <p className="mt-4 text-ink-600 dark:text-ink-200">
            Egal ob Neugestaltung, Sanierung oder kleine Reparatur – wir sind Ihr fester
            Ansprechpartner für das gesamte Projekt.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => {
            const isOpen = openId === service.id;
            return (
              <Reveal key={service.id} delay={i * 90}>
                <div className="group flex h-full flex-col rounded-2xl border border-ink-800/8 bg-sand-50 p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft dark:border-sand-100/10 dark:bg-ink-800">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-500/10 text-clay-600 transition-colors group-hover:bg-clay-500 group-hover:text-white dark:text-clay-300">
                    <Icon name={service.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink-900 dark:text-sand-50">
                    {service.title}
                  </h3>
                  <p className="text-xs font-medium uppercase tracking-wide text-clay-600 dark:text-clay-300">
                    {service.subtitle}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
                    {service.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : service.id)}
                    aria-expanded={isOpen}
                    aria-controls={`service-details-${service.id}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay-600 dark:text-clay-300"
                  >
                    Mehr erfahren
                    <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    id={`service-details-${service.id}`}
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <ul className="overflow-hidden text-sm text-ink-600 dark:text-ink-200">
                      {service.details.map((d) => (
                        <li key={d} className="flex items-start gap-2 py-1">
                          <ArrowRight size={13} className="mt-1 shrink-0 text-clay-500" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
