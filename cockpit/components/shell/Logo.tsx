export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <g transform="rotate(-16 24 24)">
        <rect x="19.5" y="3" width="9" height="42" rx="3" fill="#C1502E" />
      </g>
      <g transform="rotate(16 24 24)">
        <rect x="19.5" y="3" width="9" height="42" rx="3" fill="#C1502E" opacity="0.55" />
      </g>
    </svg>
  );
}

export function Logo({ subtitle = "Cockpit" }: { subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="size-7 shrink-0" />
      <span className="leading-none">
        <span className="block font-serif text-base font-semibold tracking-tight">SICHTWERK</span>
        <span className="mt-0.5 block text-[10px] font-medium tracking-[0.2em] text-sidebar-muted uppercase">{subtitle}</span>
      </span>
    </span>
  );
}
