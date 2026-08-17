import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { company } from "@/lib/content";

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false, follow: true },
};

// Platzhalter-Impressum gemäß § 5 TMG. Bitte vor dem Livegang von einem
// Steuerberater/Anwalt prüfen und die Platzhalter (Rechtsform,
// Handelsregister, USt-IdNr., verantwortliche Person) ausfüllen lassen.
export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main className="section-padding pt-32">
        <div className="container-content max-w-2xl">
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Impressum
          </h1>

          <section className="mt-8 space-y-1 text-sm leading-relaxed text-charcoal-light">
            <p className="font-semibold text-charcoal">Angaben gemäß § 5 TMG</p>
            <p>{company.name}</p>
            <p>[Rechtsform, z. B. Einzelunternehmen / Inhaber: Vorname Nachname]</p>
            <p>{company.address.street}</p>
            <p>{company.address.zip} {company.address.city}</p>
          </section>

          <section className="mt-8 space-y-1 text-sm leading-relaxed text-charcoal-light">
            <p className="font-semibold text-charcoal">Kontakt</p>
            <p>Telefon: {company.phone}</p>
            <p>E-Mail: {company.email}</p>
          </section>

          <section className="mt-8 space-y-1 text-sm leading-relaxed text-charcoal-light">
            <p className="font-semibold text-charcoal">Umsatzsteuer-ID</p>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
              <br />
              [USt-IdNr. eintragen]
            </p>
          </section>

          <section className="mt-8 space-y-1 text-sm leading-relaxed text-charcoal-light">
            <p className="font-semibold text-charcoal">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </p>
            <p>[Name, Anschrift wie oben]</p>
          </section>

          <section className="mt-8 space-y-1 text-sm leading-relaxed text-charcoal-light">
            <p className="font-semibold text-charcoal">Streitschlichtung</p>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                className="text-terracotta-500 underline"
                target="_blank"
                rel="noreferrer"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . Wir sind nicht verpflichtet und nicht bereit, an einem
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
