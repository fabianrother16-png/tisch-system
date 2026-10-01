import Link from "next/link";
import { cn } from "./cn";

export function Tabs({
  tabs,
  active,
  className,
}: {
  tabs: { key: string; label: string; href: string; count?: number | null }[];
  active: string;
  className?: string;
}) {
  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <nav className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              scroll={false}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
              )}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[11px] num",
                    isActive ? "bg-accent-soft text-accent-strong" : "bg-surface-3 text-muted",
                  )}
                >
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Segmentierte Umschalter (z. B. Zeitraum) */
export function Segmented({
  items,
  active,
}: {
  items: { key: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          scroll={false}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            i.key === active ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg",
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
