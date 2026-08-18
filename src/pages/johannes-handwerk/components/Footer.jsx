import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { COMPANY } from '../data.js';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-950 pt-16 text-sand-200/80">
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 font-display text-lg font-extrabold text-sand-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-sm text-sand-50">
                JH
              </span>
              {COMPANY.name}
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">{COMPANY.slogan}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-50">Kontakt</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-clay-400" /> {COMPANY.address.full}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-clay-400" />
                <a href={COMPANY.phoneHref1} className="hover:text-sand-50">
                  {COMPANY.phone1}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-clay-400" />
                <a href={COMPANY.phoneHref2} className="hover:text-sand-50">
                  {COMPANY.phone2}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-clay-400" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-sand-50">
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-50">Öffnungszeiten</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              {COMPANY.openingHours.map((slot) => (
                <li key={slot.day} className="flex items-center gap-2">
                  <Clock size={15} className="shrink-0 text-clay-400" />
                  <span>
                    {slot.day}: {slot.time}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-sand-200/50">Einsatzgebiet: {COMPANY.serviceArea}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-50">Rechtliches</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a href="#impressum" className="hover:text-sand-50">
                  Impressum
                </a>
                <span className="ml-2 text-xs text-sand-200/40">(Platzhalter)</span>
              </li>
              <li>
                <a href="#datenschutz" className="hover:text-sand-50">
                  Datenschutz
                </a>
                <span className="ml-2 text-xs text-sand-200/40">(Platzhalter)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-sand-100/10 pt-6 text-xs text-sand-200/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {COMPANY.name}. Alle Angaben ohne Gewähr – Demo-Website.</p>
          <p>Diese Seite ist eine unverbindliche Verkaufs-Demo mit Beispielinhalten.</p>
        </div>
      </div>
    </footer>
  );
}
