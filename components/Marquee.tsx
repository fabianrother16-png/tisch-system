import { MARQUEE_ITEMS } from "@/lib/constants";

function MarqueeSet() {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {MARQUEE_ITEMS.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-4 font-sans text-xl font-semibold uppercase tracking-wide text-cream sm:px-6 sm:text-2xl md:text-3xl">
            {item}
          </span>
          <span className="text-2xl text-cream/60 sm:text-3xl md:text-4xl" aria-hidden="true">
            ·
          </span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  const label = MARQUEE_ITEMS.join(", ");

  return (
    <div
      role="img"
      aria-label={`Unsere Kernleistungen: ${label}`}
      className="relative overflow-hidden border-y border-cream/10 bg-terracotta-dark py-6"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <MarqueeSet />
        <MarqueeSet />
      </div>
    </div>
  );
}
