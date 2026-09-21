import { X, Check } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { COMPARISON_ROWS, SITE } from "@/lib/constants";

export function Comparison() {
  return (
    <section className="relative overflow-hidden bg-anthracite py-28 text-cream md:py-36">
      <div className="grain-overlay pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Der Unterschied"
          tone="light"
          align="center"
          title="Normale Agentur vs. SICHTWERK"
          description="Kein Vergleich um des Vergleichs willen – so verstehen wir unsere Rolle als Agentur wirklich."
        />

        <Reveal variant="scale" className="mt-16">
          {/* Ab sm: echte Tabelle für Screenreader-Semantik */}
          <table className="hidden w-full table-fixed border-collapse overflow-hidden rounded-3xl sm:table">
            <thead>
              <tr>
                <th className="w-1/2 bg-anthracite-light px-6 py-5 text-left font-sans text-xs font-semibold uppercase tracking-[0.15em] text-cream/60">
                  Normale Agentur
                </th>
                <th className="w-1/2 bg-terracotta-dark px-6 py-5 text-left font-sans text-xs font-semibold uppercase tracking-[0.15em] text-cream">
                  {SITE.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.generic} className={i % 2 === 0 ? "bg-cream/[0.03]" : ""}>
                  <td className="border-t border-cream/10 px-6 py-5 align-top text-cream/60">
                    <div className="flex items-start gap-3">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-cream/50" strokeWidth={2} />
                      <span>{row.generic}</span>
                    </div>
                  </td>
                  <td className="border-t border-cream/10 bg-terracotta-dark/10 px-6 py-5 align-top font-medium text-cream">
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-light" strokeWidth={2.5} />
                      <span>{row.sichtwerk}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobil: gestapelte Karten statt enger Tabellenzellen */}
          <ul className="space-y-4 sm:hidden">
            {COMPARISON_ROWS.map((row) => (
              <li key={row.generic} className="rounded-2xl border border-cream/10 p-5">
                <div className="flex items-start gap-3 text-cream/50">
                  <X className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                  <span className="text-sm line-through decoration-cream/20">{row.generic}</span>
                </div>
                <div className="mt-3 flex items-start gap-3 text-cream">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-light" strokeWidth={2.5} />
                  <span className="text-sm font-medium">{row.sichtwerk}</span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
