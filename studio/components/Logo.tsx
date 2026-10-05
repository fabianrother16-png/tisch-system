export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#C1502E" />
      <rect x="14" y="26" width="36" height="10" rx="3" fill="#1E1A17" transform="rotate(-18 32 31)" />
      <rect x="14" y="30" width="36" height="10" rx="3" fill="#F5F1E8" transform="rotate(18 32 35)" />
    </svg>
  );
}
