"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartColumn,
  Clapperboard,
  FileSignature,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  Link2,
  ListTodo,
  Mail,
  Receipt,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { NAV } from "./nav";
import { Logo } from "./Logo";
import { cn } from "../ui/cn";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  users: Users,
  contract: FileSignature,
  content: Clapperboard,
  calendar: CalendarDays,
  tasks: ListTodo,
  chart: ChartColumn,
  link: Link2,
  quote: FileText,
  invoice: Receipt,
  expense: Wallet,
  finance: Landmark,
  folder: FolderOpen,
  mail: Mail,
};

export function Sidebar({
  badges,
  open,
  onClose,
}: {
  badges: Record<string, number>;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div
        className={cn("fixed inset-0 z-40 bg-black/40 lg:hidden", open ? "block" : "hidden")}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-fg transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" onClick={onClose}>
            <Logo />
          </Link>
          <button onClick={onClose} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar-fg lg:hidden" aria-label="Menü schließen">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((group, gi) => (
            <div key={gi} className="mt-4 first:mt-1">
              {group.label && (
                <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? LayoutDashboard;
                  const active = isActive(item.href);
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-active font-medium text-sidebar-fg"
                            : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-fg",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-sidebar-accent" : "")} />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="rounded-full bg-sidebar-accent px-1.5 py-px text-[11px] font-semibold text-sidebar num">
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/5 p-3">
          <Link
            href="/einstellungen"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive("/einstellungen")
                ? "bg-sidebar-active font-medium text-sidebar-fg"
                : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-fg",
            )}
          >
            <Settings className={cn("size-4", isActive("/einstellungen") && "text-sidebar-accent")} />
            Einstellungen
          </Link>
        </div>
      </aside>
    </>
  );
}
