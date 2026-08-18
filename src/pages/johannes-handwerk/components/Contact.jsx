import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, Check } from 'lucide-react';
import Reveal from './Reveal.jsx';
import { COMPANY, SERVICE_OPTIONS } from '../data.js';

const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(COMPANY.address.full)}&output=embed`;

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', service: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Bitte geben Sie Ihren Namen an.';
    if (!form.phone.trim()) nextErrors.phone = 'Bitte geben Sie eine Telefonnummer an.';
    if (!form.service) nextErrors.service = 'Bitte wählen Sie eine Leistung aus.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Demo-Verhalten: In Produktion würde hier ein Request an ein Backend /
    // Formular-Service (z. B. E-Mail-API, CRM) gesendet werden.
    setSubmitted(true);
  };

  return (
    <section id="kontakt" className="bg-sand-100 py-20 dark:bg-ink-950 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            Kontakt
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-sand-50 sm:text-4xl">
            Kostenlosen Kostenvoranschlag anfordern
          </h2>
          <p className="mt-4 text-ink-600 dark:text-ink-200">
            Erzählen Sie uns kurz von Ihrem Vorhaben – wir melden uns in der Regel innerhalb
            von 24 Stunden.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <form onSubmit={handleSubmit} noValidate className="rounded-3xl bg-white p-6 shadow-card dark:bg-ink-800 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-moss-500/15 text-moss-600 dark:text-moss-400">
                    <Check size={26} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-ink-900 dark:text-sand-50">
                    Vielen Dank, {form.name.split(' ')[0]}!
                  </h3>
                  <p className="max-w-sm text-sm text-ink-600 dark:text-ink-200">
                    Ihre Anfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich unter
                    der angegebenen Telefonnummer bei Ihnen.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  <Field label="Name" error={errors.name}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      autoComplete="name"
                      className={inputClass(errors.name)}
                      placeholder="Ihr vollständiger Name"
                    />
                  </Field>

                  <Field label="Telefonnummer" error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      autoComplete="tel"
                      className={inputClass(errors.phone)}
                      placeholder="z. B. 0176 12345678"
                    />
                  </Field>

                  <Field label="Gewünschte Leistung" error={errors.service}>
                    <select value={form.service} onChange={update('service')} className={inputClass(errors.service)}>
                      {SERVICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Ihre Nachricht (optional)">
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={update('message')}
                      className={inputClass()}
                      placeholder="Beschreiben Sie kurz Ihr Projekt…"
                    />
                  </Field>

                  <button
                    type="submit"
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-6 py-3.5 text-base font-semibold text-sand-50 shadow-soft transition-transform hover:scale-[1.01] hover:bg-clay-600 active:scale-95"
                  >
                    <Send size={16} /> Anfrage absenden
                  </button>
                  <p className="text-center text-xs text-ink-400 dark:text-ink-200">
                    Mit dem Absenden stimmen Sie unserer{' '}
                    <a href="#datenschutz" className="underline">
                      Datenschutzerklärung
                    </a>{' '}
                    zu. (Platzhalter-Link für die Demo)
                  </p>
                </div>
              )}
            </form>
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-6">
            <div className="rounded-3xl bg-white p-6 shadow-card dark:bg-ink-800 sm:p-8">
              <ContactRow icon={<Phone size={17} />} label="Telefon" value={COMPANY.phone1} href={COMPANY.phoneHref1} />
              <ContactRow icon={<Phone size={17} />} label="Alternativ" value={COMPANY.phone2} href={COMPANY.phoneHref2} />
              <ContactRow icon={<Mail size={17} />} label="E-Mail" value={COMPANY.email} href={`mailto:${COMPANY.email}`} />
              <ContactRow icon={<MapPin size={17} />} label="Adresse" value={COMPANY.address.full} />

              <a
                href={COMPANY.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-moss-500/30 py-3 text-sm font-semibold text-moss-600 transition-colors hover:bg-moss-500/10 dark:text-moss-400"
              >
                <MessageCircle size={16} /> Direkt per WhatsApp schreiben
              </a>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-card">
              <iframe
                title={`Standort von ${COMPANY.name} auf Google Maps`}
                src={MAPS_EMBED_SRC}
                width="100%"
                height="280"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-label={`Kartenausschnitt: ${COMPANY.address.full}`}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-ink-800 dark:text-sand-100">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}

function inputClass(error) {
  return `w-full rounded-xl border bg-sand-50 px-4 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-clay-500 dark:bg-ink-900 dark:text-sand-50 ${
    error ? 'border-red-400' : 'border-ink-800/10 dark:border-sand-100/10'
  }`;
}

function ContactRow({ icon, label, value, href }) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-500/10 text-clay-600 dark:text-clay-300">
        {icon}
      </span>
      <span>
        <span className="block text-xs uppercase tracking-wide text-ink-400 dark:text-ink-200">{label}</span>
        <span className="text-sm font-semibold text-ink-900 dark:text-sand-50">{value}</span>
      </span>
    </>
  );
  const rowClass = 'flex items-center gap-3 border-b border-ink-800/8 py-3 last:border-0 dark:border-sand-100/10';
  return href ? (
    <a href={href} className={`${rowClass} transition-colors hover:text-clay-600`}>
      {content}
    </a>
  ) : (
    <div className={rowClass}>{content}</div>
  );
}
