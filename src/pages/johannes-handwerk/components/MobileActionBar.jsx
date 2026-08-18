import { Phone, MessageCircle, ClipboardCheck } from 'lucide-react';
import { COMPANY } from '../data.js';

// Sticky Mobile-Aktionsleiste: gerade bei Handwerker-Anfragen kommt ein
// Großteil der Besucher über das Smartphone – Anrufen/WhatsApp müssen
// jederzeit einen Daumen-Klick entfernt sein.
export default function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-ink-800/10 bg-white/95 backdrop-blur dark:border-sand-100/10 dark:bg-ink-900/95 sm:hidden">
      <a href={COMPANY.phoneHref1} className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-clay-600 dark:text-clay-300">
        <Phone size={18} />
        <span className="text-[11px] font-semibold">Anrufen</span>
      </a>
      <a
        href={COMPANY.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 flex-col items-center gap-0.5 border-x border-ink-800/10 py-2.5 text-moss-600 dark:border-sand-100/10 dark:text-moss-400"
      >
        <MessageCircle size={18} />
        <span className="text-[11px] font-semibold">WhatsApp</span>
      </a>
      <a href="#kontakt" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-ink-700 dark:text-sand-100">
        <ClipboardCheck size={18} />
        <span className="text-[11px] font-semibold">Angebot</span>
      </a>
    </div>
  );
}
