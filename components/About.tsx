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
          </div>

          <div className="lg:col-span-7 lg:pt-4">
            <Reveal>
              <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-anthracite/75">
                <p>
                  ROTHERWERK ist aus einer einfachen Beobachtung entstanden: Die
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
                  Heute ist ROTHERWERK die Werkstatt für alles, was ein
                  Unternehmen online sichtbar macht – gegründet in Bielefeld,
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
