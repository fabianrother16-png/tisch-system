import { useState } from 'react';
import { MoveHorizontal, Image as ImageIcon } from 'lucide-react';
import Reveal from './Reveal.jsx';
import { GALLERY_PROJECTS } from '../data.js';

// Vorher/Nachher-Galerie mit Schieberegler. Da für die Demo keine echten
// Kundenfotos vorliegen, verwenden wir klar gekennzeichnete Platzhalter-
// Flächen (Farbverlauf + Icon) an Stelle von Bildern. Die Komponente ist so
// gebaut, dass beforeImage/afterImage jederzeit durch echte <img>-URLs
// ersetzt werden können, ohne die Slider-Logik anzufassen.
export default function Gallery() {
  return (
    <section id="galerie" className="bg-sand-100 py-20 dark:bg-ink-950 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            Referenzprojekte
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-sand-50 sm:text-4xl">
            Vorher &amp; Nachher
          </h2>
          <p className="mt-4 text-ink-600 dark:text-ink-200">
            Bewegen Sie den Regler und sehen Sie den Unterschied. (Platzhalter-Beispiele –
            werden mit echten Projektfotos ersetzt.)
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {GALLERY_PROJECTS.map((project, i) => (
            <Reveal key={project.id} delay={i * 100}>
              <BeforeAfterCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterCard({ project }) {
  const [pos, setPos] = useState(50);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card dark:bg-ink-800">
      <div
        className="relative aspect-[4/3] select-none overflow-hidden"
        role="group"
        aria-label={`Vorher/Nachher-Vergleich: ${project.title}`}
      >
        {/* Nachher-Ebene (Hintergrund, voll sichtbar) */}
        <PlaceholderPane variant="after" label={project.afterLabel} />

        {/* Vorher-Ebene (wird per clip-path je nach Reglerposition eingeblendet) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <PlaceholderPane variant="before" label={project.beforeLabel} />
        </div>

        {/* Trennlinie + Griff */}
        <div className="absolute inset-y-0 z-10 w-0.5 bg-white/80" style={{ left: `${pos}%` }}>
          <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-800 shadow-lg">
            <MoveHorizontal size={16} />
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Vorher/Nachher-Regler für ${project.title}`}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>

      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
          {project.category}
        </span>
        <h3 className="mt-1 font-display font-bold text-ink-900 dark:text-sand-50">{project.title}</h3>
      </div>
    </div>
  );
}

function PlaceholderPane({ variant, label }) {
  const isBefore = variant === 'before';
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${
        isBefore
          ? 'bg-gradient-to-br from-ink-400 to-ink-600 text-sand-100'
          : 'bg-gradient-to-br from-clay-400 to-clay-600 text-sand-50'
      }`}
    >
      <ImageIcon size={28} className="opacity-70" />
      <span className="px-4 text-center text-xs font-medium opacity-90">{label}</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        Beispielbild
      </span>
    </div>
  );
}
