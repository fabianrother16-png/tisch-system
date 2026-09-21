type LogoProps = {
  className?: string;
  monochrome?: boolean;
};

export function LogoMark({ className = "h-8 w-8", monochrome = false }: LogoProps) {
  const barColor = monochrome ? "currentColor" : "#C1502E";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g transform="rotate(-16 24 24)">
        <rect x="19.5" y="3" width="9" height="42" rx="3" fill={barColor} />
      </g>
      <g transform="rotate(16 24 24)">
        <rect x="19.5" y="3" width="9" height="42" rx="3" fill={barColor} opacity="0.55" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className="font-serif text-lg font-semibold tracking-tight">
        SICHTWERK
      </span>
    </span>
  );
}
