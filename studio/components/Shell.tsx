"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Inbox, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { SEGMENTS } from "@/lib/segments";
import { LogoMark } from "./Logo";
import { SegmentIcon } from "./SegmentIcon";
import { StudioProvider, type StudioInfo } from "./StudioContext";

const MAIN = [
  { href: "/", label: "Übersicht", icon: LayoutDashboard },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/ergebnisse", label: "Ergebnisse", icon: Inbox },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
];

export function Shell({
  children,
  agenturName,
  passwordProtected,
  info,
}: {
  children: React.ReactNode;
  agenturName: string;
  passwordProtected: boolean;
  info: StudioInfo;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const linkClass = (on: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
      on ? "bg-cream text-anthracite font-semibold" : "text-cream/75 hover:bg-anthracite-lighter hover:text-cream"
    }`;

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  // Mobiles Menü schließt sich, sobald ein Link angeklickt wird.
  const nav = (
    <nav
      className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) setOpen(false);
      }}
    >
      <Link href="/" className="flex items-center gap-3 px-2">
        <LogoMark />
        <div className="leading-tight">
          <div className="font-serif text-lg font-semibold tracking-tight text-cream">{agenturName}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-terracotta-light">Studio</div>
        </div>
      </Link>

      <div className="space-y-1">
        {MAIN.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(active(href))}>
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      <div>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/40">Segmente</div>
        <div className="space-y-0.5">
          {SEGMENTS.map((s) => (
            <Link key={s.slug} href={`/segment/${s.slug}`} className={linkClass(active(`/segment/${s.slug}`))}>
              <SegmentIcon slug={s.slug} className="h-4 w-4" />
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-1 border-t border-anthracite-lighter pt-4">
        <Link href="/einstellungen" className={linkClass(active("/einstellungen"))}>
          <Settings className="h-4 w-4" aria-hidden />
          Einstellungen
        </Link>
        {passwordProtected && (
          <button onClick={logout} className={`${linkClass(false)} w-full`}>
            <LogOut className="h-4 w-4" aria-hidden />
            Abmelden
          </button>
        )}
      </div>
    </nav>
  );

  return (
    <StudioProvider value={info}>
      <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-screen bg-anthracite md:block">{nav}</aside>

        <header className="sticky top-0 z-30 flex items-center justify-between bg-anthracite px-4 py-3 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-serif text-base font-semibold text-cream">{agenturName} Studio</span>
          </Link>
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-cream" aria-label="Menü öffnen">
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
            <button className="absolute inset-0 bg-anthracite/60" aria-label="Menü schließen" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-anthracite">
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1 text-cream" aria-label="Menü schließen">
                <X className="h-5 w-5" />
              </button>
              {nav}
            </div>
          </div>
        )}

        <main className="min-w-0 px-4 pb-16 pt-6 md:px-8 md:pt-8">{children}</main>
      </div>
    </StudioProvider>
  );
}
