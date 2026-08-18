import { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import Reveal from './Reveal.jsx';
import { TESTIMONIALS } from '../data.js';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = TESTIMONIALS.length;

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <section id="bewertungen" className="bg-white py-20 dark:bg-ink-900 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            Bewertungen
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-sand-50 sm:text-4xl">
            Das sagen unsere Kunden
          </h2>
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={20} className="fill-clay-500 text-clay-500" />
            ))}
            <span className="ml-2 text-sm font-semibold text-ink-700 dark:text-sand-100">4,8 / 5</span>
          </div>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-3 flex max-w-md items-center justify-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-center text-xs text-ink-400 dark:bg-ink-800 dark:text-ink-200">
          <Info size={13} className="shrink-0" />
          Beispiel-Bewertungen zur Illustration – auf der finalen Seite mit echten
          Google-Rezensionen austauschbar.
        </Reveal>

        <div className="relative mt-10">
          <div className="overflow-hidden rounded-3xl bg-sand-50 shadow-card dark:bg-ink-800">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {TESTIMONIALS.map((t) => (
                <figure key={t.name} className="w-full shrink-0 px-8 py-10 sm:px-14 sm:py-14">
                  <Quote className="h-8 w-8 text-clay-500/40" />
                  <blockquote className="mt-4 font-display text-lg font-medium leading-relaxed text-ink-800 dark:text-sand-50 sm:text-xl">
                    „{t.text}“
                  </blockquote>
                  <figcaption className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-500/15 font-display font-bold text-clay-600 dark:text-clay-300">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900 dark:text-sand-50">{t.name}</div>
                      <div className="text-xs text-ink-400 dark:text-ink-200">
                        {t.location} · {t.service}
                      </div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < t.rating ? 'fill-clay-500 text-clay-500' : 'text-ink-800/15 dark:text-sand-100/15'}
                        />
                      ))}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Vorherige Bewertung"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-800/10 text-ink-600 transition-colors hover:border-clay-500 hover:text-clay-600 dark:border-sand-100/10 dark:text-sand-100"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1.5" role="tablist" aria-label="Bewertung wählen">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Bewertung ${i + 1} von ${count}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-clay-500' : 'w-2 bg-ink-800/15 dark:bg-sand-100/20'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              aria-label="Nächste Bewertung"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-800/10 text-ink-600 transition-colors hover:border-clay-500 hover:text-clay-600 dark:border-sand-100/10 dark:text-sand-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
