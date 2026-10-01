import { Globe } from "lucide-react";
import { PLATFORM_COLORS } from "@/lib/constants";
import { cn } from "./ui/cn";

/** Schlichte Plattform-Symbole (lucide enthält keine Marken-Icons mehr). */
export function PlatformIcon({ platform, className, colored = true }: { platform: string; className?: string; colored?: boolean }) {
  const color = colored ? PLATFORM_COLORS[platform] ?? "currentColor" : "currentColor";
  const cls = cn("size-4 shrink-0", className);
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke={color} strokeWidth="2" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={cn(cls, colored && "dark:[&_path]:fill-white")} aria-hidden>
          <path
            fill={color}
            d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.1c-1.4.1-2.7-.3-3.9-1.1v6.1c0 3.4-2.5 6-6 6-3.2 0-5.9-2.5-5.9-5.8 0-3.6 3.1-6.3 6.8-5.7v3.2c-1.8-.5-3.6.7-3.6 2.5 0 1.5 1.2 2.7 2.7 2.7 1.6 0 2.8-1.1 2.8-3V3h3.2z"
          />
        </svg>
      );
    case "facebook":
    case "meta":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <circle cx="12" cy="12" r="10" fill={color} />
          <path fill="#fff" d="M13.3 20v-6.1h2.1l.3-2.5h-2.4V9.9c0-.7.2-1.2 1.2-1.2h1.3V6.5c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.8H8.6v2.5h2.1V20h2.6z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="4" fill={color} />
          <path fill="#fff" d="M10 9v6l5-3z" />
        </svg>
      );
    case "google":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path fill={colored ? "#4285F4" : color} d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
          <path fill={colored ? "#34A853" : color} d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
          <path fill={colored ? "#FBBC05" : color} d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" />
          <path fill={colored ? "#EA4335" : color} d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="4" fill={color} />
          <path fill="#fff" d="M7 10h2.5v7H7zM8.2 6.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM11 10h2.4v1c.4-.7 1.2-1.2 2.4-1.2 2.3 0 2.7 1.5 2.7 3.4V17H16v-3.3c0-.8 0-1.8-1.1-1.8s-1.3.9-1.3 1.8V17H11z" />
        </svg>
      );
    default:
      return <Globe className={cls} style={{ color }} />;
  }
}
