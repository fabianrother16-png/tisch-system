import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { LogoMark } from "./Logo";

export function About() {
  return (
    <section id="ueber-uns" className="bg-cream py-28 md:py-36">
      <Container>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Über uns"
              title={
                <>
                  Zwei Brüder.
                  <br />
                  Ein Werk.
                </>
              }
            />

            {/*
              TODO: Platzhalter-Monogramme durch echte Porträtfotos der
              beiden Gründer ersetzen, sobald vorhanden (z. B. <Image fill
              className="object-cover" .../> statt der Kreis-Initialen).
              Volle Namen bewusst nicht erfunden/eingesetzt.
            */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="flex aspect-[3/4] flex-col items-center justify-end gap-3 rounded-2xl bg-anthracite p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream">
                  <span className="font-serif text-2xl text-anthracite">F</span>
                </div>
                <span className="font-sans text-xs uppercase tracking-[0.15em] text-cream/70">
                  Mitgründer
                </span>
              </div>
              <div className="flex aspect-[3/4] flex-col items-center justify-end gap-3 rounded-2xl bg-terracotta-dark p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream">
                  <span className="font-serif text-2xl text-anthracite">R</span>
                </div>
                <span className="font-sans text-xs uppercase tracking-[0.15em] text-cream">
                  Mitgründer
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <p className="font-serif text-sm italic leading-snug text-anthracite/70">
                &ldquo;Ich wollte nie nur Kampagnen verwalten, sondern sehen,
                wie ein Betrieb vor Ort wächst.&rdquo;
                <span className="mt-1 block font-sans text-xs not-italic uppercase tracking-[0.1em] text-anthracite/70">
                  — F.
                </span>
              </p>
              <p className="font-serif text-sm italic leading-snug text-anthracite/70">
                &ldquo;Wir kennen die Betriebe hier persönlich – das merkt
                man in jedem Projekt.&rdquo;
                <span className="mt-1 block font-sans text-xs not-italic uppercase tracking-[0.1em] text-anthracite/70">
                  — R.
                </span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pt-4">
            <Reveal>
              <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-anthracite/75">
                <p>
                  SICHTWERK ist aus einer einfachen Beobachtung entstanden: Die
                  besten Betriebe im Mittelstand – Restaurants, Handwerk,
                  lokale Dienstleister – werden online oft unter Wert
                  verkauft. Tolle Arbeit, aber kaum sichtbar.
                </p>
                <p>
                  Als Brüder mit dem Anspruch, Dinge selbst in die Hand zu
                  nehmen, haben wir beschlossen, das zu ändern. Statt fertiger
                  Templates und austauschbarer Kampagnen liefern wir echte
                  Handarbeit: Wir stehen selbst mit Kamera und Drohne vor Ort,
                  verstehen das Geschäft unserer Kunden und bauen daraus
                  Sichtbarkeit, die bleibt.
                </p>
                <p>
                  Heute ist SICHTWERK die Werkstatt für alles, was ein
                  Unternehmen online sichtbar macht – gegründet in Gütersloh,
                  gedacht für den Mittelstand.
                </p>
              </div>

              <div className="mt-10 flex items-center gap-4 border-t border-anthracite/10 pt-8">
                <LogoMark className="h-9 w-9" />
                <p className="font-serif text-xl italic text-anthracite/80">
                  &ldquo;Wir bauen Sichtbarkeit, wie wir sie uns selbst
                  wünschen würden.&rdquo;
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
