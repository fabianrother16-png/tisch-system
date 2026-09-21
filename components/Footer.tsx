import { Instagram, Facebook, Linkedin } from "lucide-react";
import { Container } from "./ui/Container";
import { Logo } from "./Logo";
import { NAV_LINKS, SITE } from "@/lib/constants";

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-anthracite pt-20 text-cream">
      <Container>
        <div className="flex flex-col gap-12 border-b border-cream/10 pb-14 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-cream/60">
              {SITE.claim}. Marketing-Agentur aus {SITE.city} für
              mittelständische Unternehmen und Restaurants.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-terracotta hover:text-terracotta-light"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream/40">
                Navigation
              </h4>
              <ul className="mt-4 space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-sans text-sm text-cream/70 hover:text-terracotta-light"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream/40">
                Kontakt
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="font-sans text-sm text-cream/70 hover:text-terracotta-light"
                  >
                    {SITE.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${SITE.phoneHref}`}
                    className="font-sans text-sm text-cream/70 hover:text-terracotta-light"
                  >
                    {SITE.phone}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream/40">
                Rechtliches
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href="#" className="font-sans text-sm text-cream/70 hover:text-terracotta-light">
                    Impressum
                  </a>
                </li>
                <li>
                  <a href="#" className="font-sans text-sm text-cream/70 hover:text-terracotta-light">
                    Datenschutz
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-8 text-xs text-cream/40 sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. Alle Rechte vorbehalten.</span>
          <span>Gestaltet &amp; gebaut in {SITE.city}.</span>
        </div>
      </Container>
    </footer>
  );
}
