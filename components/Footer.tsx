import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { company } from "@/lib/content";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-charcoal text-sand-100">
      <div className="container-content grid grid-cols-1 gap-10 py-14 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta-500">
              <span className="h-3 w-3 rounded-sm bg-slate-700" />
            </span>
            <span className="font-display text-lg font-semibold text-white">
              {company.name}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-sand-100/70">
            {company.claim}
            <br />
            Fliesenlegermeister-Betrieb in Dortmund.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-100/50">
            Kontakt
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-sand-100/80">
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 flex-shrink-0" />
              <span>
                {company.address.street}
                <br />
                {company.address.zip} {company.address.city}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="flex-shrink-0" />
              <a href={company.phoneHref} className="hover:text-terracotta-300">
                {company.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="flex-shrink-0" />
              <a href={company.emailHref} className="hover:text-terracotta-300">
                {company.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-100/50">
            Navigation
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-sand-100/80">
            <li><a href="#leistungen" className="hover:text-terracotta-300">Leistungen</a></li>
            <li><a href="#referenzen" className="hover:text-terracotta-300">Referenzen</a></li>
            <li><a href="#ueber-uns" className="hover:text-terracotta-300">Über uns</a></li>
            <li><a href="#kontakt" className="hover:text-terracotta-300">Kontakt</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-content flex flex-col gap-3 py-6 text-xs text-sand-100/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {company.name}. Alle Rechte vorbehalten.</p>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-terracotta-300">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-terracotta-300">
              Datenschutz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
