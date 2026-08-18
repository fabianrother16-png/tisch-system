import { useEffect, useState } from 'react';
import { Phone, Menu, X, Sun, Moon, MessageCircle } from 'lucide-react';
import { COMPANY } from '../data.js';

const NAV_LINKS = [
  { href: '#leistungen', label: 'Leistungen' },
  { href: '#warum-wir', label: 'Warum wir' },
  { href: '#bewertungen', label: 'Bewertungen' },
  { href: '#galerie', label: 'Referenzen' },
  { href: '#termin', label: 'Termin' },
  { href: '#kontakt', label: 'Kontakt' },
];

export default function Header({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? 'bg-sand-50/90 dark:bg-ink-950/90 backdrop-blur shadow-card border-b border-ink-800/5 dark:border-sand-100/5'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5 font-display font-extrabold tracking-tight text-ink-900 dark:text-sand-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay-500 text-sand-50 shadow-card">JH</span>
          <span className="hidden text-lg sm:inline">{COMPANY.name}</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Hauptnavigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-clay-600 dark:text-ink-200 dark:hover:text-clay-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-ink-800/10 text-ink-600 transition-colors hover:border-clay-400 hover:text-clay-600 dark:border-sand-100/10 dark:text-ink-200 sm:flex"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <a
            href={COMPANY.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Per WhatsApp schreiben"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-moss-500/30 text-moss-600 transition-colors hover:bg-moss-500/10 dark:text-moss-400 sm:flex"
          >
            <MessageCircle size={16} />
          </a>

          <a
            href={COMPANY.phoneHref1}
            className="inline-flex items-center gap-2 rounded-full bg-clay-500 px-3.5 py-2 text-sm font-semibold text-sand-50 shadow-card transition-transform hover:scale-[1.03] hover:bg-clay-600 active:scale-95 sm:px-4"
          >
            <Phone size={15} />
            <span className="hidden sm:inline">Jetzt anrufen</span>
          </a>

          <button
            type="button"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-700 dark:text-sand-100 lg:hidden"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-ink-800/10 bg-sand-50 px-4 pb-5 pt-2 dark:border-sand-100/10 dark:bg-ink-950 lg:hidden"
        >
          <div className="flex flex-col divide-y divide-ink-800/5 dark:divide-sand-100/5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="py-3 text-base font-medium text-ink-700 dark:text-sand-100"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ink-800/10 py-2.5 text-sm font-medium text-ink-700 dark:border-sand-100/10 dark:text-sand-100"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Hell' : 'Dunkel'}
            </button>
            <a
              href={COMPANY.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-moss-500/30 py-2.5 text-sm font-medium text-moss-600 dark:text-moss-400"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
