type LogoProps = {
  className?: string;
  monochrome?: boolean;
};

export function LogoMark({ className = "h-8 w-8", monochrome = false }: LogoProps) {
  const barColor = monochrome ? "currentColor" : "#C1502E";
  const starColor = monochrome ? "currentColor" : "#C1502E";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="28" width="7" height="16" rx="1.5" fill={barColor} opacity="0.55" />
      <rect x="15" y="20" width="7" height="24" rx="1.5" fill={barColor} opacity="0.75" />
      <rect x="26" y="12" width="7" height="32" rx="1.5" fill={barColor} opacity="0.9" />
      <path
        d="M40.5 4L42.4 9.6L48 11.5L42.4 13.4L40.5 19L38.6 13.4L33 11.5L38.6 9.6L40.5 4Z"
        fill={starColor}
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className="font-serif text-lg font-semibold tracking-tight">
        ROTHERWERK
      </span>
    </span>
  );
}
