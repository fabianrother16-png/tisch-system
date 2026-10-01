/* RM-Bildmarke von Rother Marketing (gleiche Pfade wie auf der Website). */
export function RmMarke({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1012 573" className={className} fill="currentColor" aria-hidden>
      <path d="M0 10H402A187 187 0 0 1 455 374L644 573H484L190 266H402A71 71 0 0 0 402 124H95Z" />
      <path d="M95 268L222 393V573H95Z" />
      <path d="M610 219L695 300L1012 0V572H890V271L695 452L569 326A210 210 0 0 0 610 219Z" />
    </svg>
  );
}

/** Kompakte Marke für kleine Flächen (z. B. Login) */
export function LogoMark({ className = "h-6 w-auto" }: { className?: string }) {
  return <RmMarke className={className} />;
}

export function Logo({ subtitle = "Cockpit" }: { subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <RmMarke className="h-[22px] w-auto shrink-0 text-sidebar-accent" />
      <span className="leading-none">
        <span className="block text-[13px] font-bold tracking-[0.08em] uppercase">
          Rother <span className="font-normal">Marketing</span>
        </span>
        <span className="mt-1 block text-[10px] font-medium tracking-[0.22em] text-sidebar-muted uppercase">{subtitle}</span>
      </span>
    </span>
  );
}
