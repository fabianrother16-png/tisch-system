import { useMemo, useState } from 'react';
import { CalendarDays, Clock, Check, Info } from 'lucide-react';
import Reveal from './Reveal.jsx';

const TIME_SLOTS = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00'];

// Reine Demo-Terminbuchung: erzeugt die nächsten 14 Tage (ohne Sonntage),
// simuliert zufällig ausgebuchte Slots und "bestätigt" die Anfrage lokal.
// Für den echten Einsatz würde hier ein Kalender-Backend (z. B. Cal.com,
// Google Calendar API) angebunden.
function useDemoDays() {
  return useMemo(() => {
    const days = [];
    const today = new Date();
    let cursor = new Date(today);
    while (days.length < 10) {
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() === 0) continue; // Sonntag: geschlossen
      const seed = cursor.getDate() + cursor.getMonth() * 31;
      const bookedSlots = TIME_SLOTS.filter((_, i) => (seed + i) % 4 === 0);
      days.push({
        date: new Date(cursor),
        bookedSlots,
      });
    }
    return days;
  }, []);
}

export default function Booking() {
  const days = useDemoDays();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const day = days[selectedDay];
  const formatter = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

  const handleConfirm = () => {
    if (!selectedSlot) return;
    setConfirmed(true);
  };

  return (
    <section id="termin" className="bg-white py-20 dark:bg-ink-900 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay-600 dark:text-clay-300">
            Terminanfrage
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-sand-50 sm:text-4xl">
            Vor-Ort-Termin für Ihre Besichtigung
          </h2>
          <p className="mt-4 text-ink-600 dark:text-ink-200">
            Wählen Sie einen passenden Termin – wir bestätigen ihn anschließend persönlich
            per Telefon oder E-Mail.
          </p>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-3 flex max-w-md items-center justify-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-center text-xs text-ink-400 dark:bg-ink-800 dark:text-ink-200">
          <Info size={13} className="shrink-0" />
          Demo-Funktion zur Veranschaulichung – noch nicht mit einem echten Kalender verbunden.
        </Reveal>

        <div className="mt-10 rounded-3xl border border-ink-800/8 bg-sand-50 p-6 shadow-card dark:border-sand-100/10 dark:bg-ink-800 sm:p-8">
          {confirmed ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-moss-500/15 text-moss-600 dark:text-moss-400">
                <Check size={26} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink-900 dark:text-sand-50">
                Terminanfrage vorgemerkt!
              </h3>
              <p className="max-w-sm text-sm text-ink-600 dark:text-ink-200">
                {formatter.format(day.date)} um {selectedSlot} Uhr. Wir melden uns kurz zur
                Bestätigung bei Ihnen – bitte hinterlassen Sie uns dafür noch Ihre
                Kontaktdaten im Formular weiter unten.
              </p>
              <a
                href="#kontakt"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-clay-500 px-5 py-2.5 text-sm font-semibold text-sand-50 hover:bg-clay-600"
              >
                Zum Kontaktformular
              </a>
              <button
                type="button"
                onClick={() => {
                  setConfirmed(false);
                  setSelectedSlot(null);
                }}
                className="text-xs font-medium text-ink-400 underline-offset-2 hover:underline dark:text-ink-200"
              >
                Anderen Termin wählen
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-sand-100">
                <CalendarDays size={16} className="text-clay-500" /> Tag wählen
              </div>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {days.map((d, i) => (
                  <button
                    key={d.date.toISOString()}
                    onClick={() => {
                      setSelectedDay(i);
                      setSelectedSlot(null);
                    }}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                      i === selectedDay
                        ? 'border-clay-500 bg-clay-500 text-white'
                        : 'border-ink-800/10 text-ink-600 hover:border-clay-400 dark:border-sand-100/10 dark:text-ink-200'
                    }`}
                  >
                    <span className="font-semibold">{formatter.format(d.date)}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-sand-100">
                <Clock size={16} className="text-clay-500" /> Uhrzeit wählen
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {TIME_SLOTS.map((slot) => {
                  const booked = day.bookedSlots.includes(slot);
                  const selected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      disabled={booked}
                      onClick={() => setSelectedSlot(slot)}
                      aria-pressed={selected}
                      className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${
                        booked
                          ? 'cursor-not-allowed border-ink-800/5 text-ink-800/25 line-through dark:text-sand-100/20'
                          : selected
                            ? 'border-clay-500 bg-clay-500 text-white'
                            : 'border-ink-800/10 text-ink-700 hover:border-clay-400 dark:border-sand-100/10 dark:text-sand-100'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedSlot}
                onClick={handleConfirm}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay-500 px-6 py-3.5 text-base font-semibold text-sand-50 shadow-soft transition-transform hover:scale-[1.01] hover:bg-clay-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Termin unverbindlich anfragen
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
