import type { ReactNode } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { company } from "@/lib/content";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="kontakt" className="section-padding bg-sand-50">
      <div className="container-content">
        <div className="max-w-xl">
          <p className="eyebrow">Kontakt</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
            Lassen Sie uns über Ihr Projekt sprechen
          </h2>
          <p className="mt-4 text-base leading-relaxed text-charcoal-light">
            Schreiben Sie uns eine Nachricht oder rufen Sie direkt an – wir
            melden uns kurzfristig mit einem unverbindlichen Angebot.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Kontaktinformationen */}
          <div className="space-y-5">
            <InfoCard icon={MapPin} title="Adresse">
              {company.address.street}
              <br />
              {company.address.zip} {company.address.city}
            </InfoCard>
            <InfoCard icon={Phone} title="Telefon">
              <a href={company.phoneHref} className="hover:text-terracotta-500">
                {company.phone}
              </a>
            </InfoCard>
            <InfoCard icon={Mail} title="E-Mail">
              <a href={company.emailHref} className="hover:text-terracotta-500">
                {company.email}
              </a>
            </InfoCard>
            <InfoCard icon={Clock} title="Erreichbarkeit">
              {company.openingHours.map((slot) => (
                <div key={slot.days} className="flex justify-between gap-4">
                  <span>{slot.days}</span>
                  <span className="text-charcoal-light">{slot.hours}</span>
                </div>
              ))}
            </InfoCard>
          </div>

          {/* Formular */}
          <div className="rounded-xl2 border border-charcoal/5 bg-white p-6 shadow-card sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-xl2 border border-charcoal/5 bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-semibold text-charcoal">{title}</p>
        <div className="mt-1 text-sm text-charcoal-light">{children}</div>
      </div>
    </div>
  );
}
