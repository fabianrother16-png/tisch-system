import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { company } from "@/lib/content";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  robots: { index: false, follow: true },
};

// Platzhalter-Datenschutzerklärung. Bitte vor dem Livegang an die tatsächlich
// eingesetzten Dienste anpassen (z.B. Hosting-Anbieter, E-Mail-Versanddienst,
// Analyse-Tools) und rechtlich prüfen lassen.
export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main className="section-padding pt-32">
        <div className="container-content max-w-2xl space-y-8 text-sm leading-relaxed text-charcoal-light">
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Datenschutzerklärung
          </h1>

          <section>
            <h2 className="font-semibold text-charcoal">1. Verantwortlicher</h2>
            <p className="mt-2">
              {company.name}
              <br />
              {company.address.street}
              <br />
              {company.address.zip} {company.address.city}
              <br />
              E-Mail: {company.email}
              <br />
              Telefon: {company.phone}
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-charcoal">2. Hosting</h2>
            <p className="mt-2">
              Diese Website wird bei [Hosting-Anbieter, z. B. Vercel Inc.]
              gehostet. Beim Aufruf der Website werden automatisch
              Server-Logdateien erhoben (z. B. IP-Adresse, Datum/Uhrzeit,
              aufgerufene Seite, Browsertyp), um den technischen Betrieb der
              Website sicherzustellen (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-charcoal">3. Kontaktformular</h2>
            <p className="mt-2">
              Wenn Sie uns über das Kontaktformular Anfragen zukommen lassen,
              werden Ihre Angaben aus dem Formular inklusive der von Ihnen
              dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und
              für den Fall von Anschlussfragen bei uns gespeichert
              (Art. 6 Abs. 1 lit. b DSGVO). Diese Daten geben wir nicht ohne
              Ihre Einwilligung weiter.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-charcoal">4. Chat-Widget</h2>
            <p className="mt-2">
              Die Nachrichten, die Sie über das Chat-Widget senden, werden zur
              Beantwortung Ihrer Anfrage verarbeitet (Art. 6 Abs. 1 lit. f
              DSGVO). Aktuell erfolgt die Beantwortung regelbasiert ohne
              externe KI-Dienste. Sollte künftig ein externer KI-Dienst
              angebunden werden, wird diese Erklärung entsprechend ergänzt.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-charcoal">5. Ihre Rechte</h2>
            <p className="mt-2">
              Sie haben jederzeit das Recht auf Auskunft, Berichtigung,
              Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
              sowie Widerspruch gegen die Verarbeitung Ihrer personenbezogenen
              Daten. Wenden Sie sich hierzu an die oben genannte
              Kontaktadresse.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
