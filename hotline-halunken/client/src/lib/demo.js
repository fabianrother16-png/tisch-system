// Demo-Modus (vite build --mode demo): Die ganze Spiellogik läuft im Browser, gespielt wird allein gegen Bots.
export const DEMO = import.meta.env.MODE === 'demo';

// In eingebetteten Seiten sind Dialoge teils blockiert – in der Demo fragen wir deshalb nicht nach.
export function confirmAction(message) {
  if (DEMO) return true;
  return window.confirm(message);
}
