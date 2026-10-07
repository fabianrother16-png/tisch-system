"use client";

import { Building2, Clapperboard, LayoutDashboard, Lock, Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/Logo";
import { fetchStatus, setStudioKey, type StatusResponse } from "@/lib/studio/api";
import { useCollection } from "@/lib/studio/db";
import { Btn, cx, TextInput } from "./ui";

type StatusContextValue = { status: StatusResponse | null; refresh: () => Promise<void> };

const StatusContext = createContext<StatusContextValue>({ status: null, refresh: async () => {} });

export function useStudioStatus() {
  return useContext(StatusContext);
}

export function StudioShell({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const pathname = usePathname();
  // Das Mobile-Menü gilt nur für die Seite, auf der es geöffnet wurde –
  // nach einer Navigation ist es automatisch wieder zu.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (fn: (open: boolean) => boolean) => setMenuPath(fn(menuOpen) ? pathname : null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await fetchStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setStatus(await fetchStatus());
      } catch {
        setStatus(null);
      }
    };
    void load();
    const onUnauthorized = () => void load();
    window.addEventListener("studio:unauthorized", onUnauthorized);
    return () => window.removeEventListener("studio:unauthorized", onUnauthorized);
  }, []);

  const locked = status ? status.passwordRequired && !status.authorized : false;

  return (
    <StatusContext.Provider value={{ status, refresh }}>
      <div className="min-h-screen bg-ink-900 text-cream">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cream/[0.06] bg-ink-900/90 px-4 py-3 backdrop-blur lg:hidden">
          <StudioBrand />
          <button
            className="rounded-lg p-2 text-cream/70 hover:bg-ink-700"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menü"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        <div className="lg:flex">
          <aside
            className={cx(
              "border-r border-cream/[0.06] bg-ink-900 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col",
              menuOpen ? "block" : "hidden",
            )}
          >
            <div className="hidden px-5 pb-4 pt-6 lg:block">
              <StudioBrand />
            </div>
            <Nav />
            <div className="mt-auto hidden px-5 pb-5 lg:block">
              <ProviderDots status={status} />
            </div>
          </aside>
          <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
        {locked && <PasswordGate onUnlocked={refresh} />}
      </div>
    </StatusContext.Provider>
  );
}

function StudioBrand() {
  return (
    <Link href="/studio" className="inline-flex items-center gap-2.5">
      <LogoMark className="h-7 w-7" />
      <span className="font-serif text-lg font-semibold tracking-tight">
        SICHTWERK <span className="text-terracotta-light">Studio</span>
      </span>
    </Link>
  );
}

function Nav() {
  const pathname = usePathname();
  const clients = useCollection("clients");
  const item = (href: string, label: string, icon: ReactNode, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={cx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-ink-700 text-cream" : "text-cream/60 hover:bg-ink-800 hover:text-cream",
        )}
      >
        {icon}
        {label}
      </Link>
    );
  };
  return (
    <nav className="space-y-1 px-3 py-3 lg:py-0" aria-label="Studio">
      {item("/studio", "Übersicht", <LayoutDashboard className="h-4 w-4" />, true)}
      {item("/studio/videos", "Alle Videos", <Clapperboard className="h-4 w-4" />)}
      <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/35">Kunden</p>
      {clients?.length ? (
        clients.slice(0, 12).map((c) => (
          <Link
            key={c.id}
            href={`/studio/kunde/${c.id}`}
            className={cx(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              pathname.startsWith(`/studio/kunde/${c.id}`) ? "bg-ink-700 text-cream" : "text-cream/60 hover:bg-ink-800 hover:text-cream",
            )}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-cream"
              style={{ background: c.brand.primary }}
            >
              {c.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{c.name}</span>
          </Link>
        ))
      ) : (
        <p className="px-3 text-xs text-cream/40">Noch keine Kunden</p>
      )}
      {item("/studio/kunde/neu", "Neuer Kunde", <Building2 className="h-4 w-4" />)}
      <div className="pt-5">{item("/studio/einstellungen", "Einstellungen", <Settings className="h-4 w-4" />)}</div>
    </nav>
  );
}

function ProviderDots({ status }: { status: StatusResponse | null }) {
  const rows: [string, boolean | undefined][] = [
    ["Claude (Analyse & Skripte)", status?.claude],
    ["Apify (TikTok & Instagram)", status?.apify],
    ["ElevenLabs (Stimme & Untertitel)", status?.elevenlabs],
    ["fal.ai (KI-Video)", status?.fal],
  ];
  return (
    <Link href="/studio/einstellungen" className="block rounded-xl bg-ink-800 p-3 text-xs hover:bg-ink-700">
      <p className="mb-2 font-semibold text-cream/70">Dienste</p>
      <ul className="space-y-1.5">
        {rows.map(([label, ok]) => (
          <li key={label} className="flex items-center gap-2 text-cream/55">
            <span className={cx("h-2 w-2 rounded-full", ok ? "bg-emerald-400" : ok === false ? "bg-red-400" : "bg-cream/20")} />
            {label}
          </li>
        ))}
      </ul>
    </Link>
  );
}

function PasswordGate({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/95 p-4 backdrop-blur">
      <form
        className="w-full max-w-sm rounded-2xl border border-cream/10 bg-ink-800 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setStudioKey(value);
          const status = await fetchStatus().catch(() => null);
          setBusy(false);
          if (status?.authorized) {
            setFailed(false);
            await onUnlocked();
          } else {
            setFailed(true);
          }
        }}
      >
        <Lock className="mb-3 h-6 w-6 text-terracotta-light" />
        <h1 className="font-serif text-xl font-semibold">Studio entsperren</h1>
        <p className="mt-1 text-sm text-cream/60">Bitte das Studio-Passwort eingeben (STUDIO_PASSWORD).</p>
        <TextInput
          type="password"
          autoFocus
          className="mt-4"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Passwort"
          aria-label="Studio-Passwort"
        />
        {failed && <p className="mt-2 text-sm text-red-300">Passwort falsch.</p>}
        <Btn type="submit" className="mt-4 w-full" loading={busy}>
          Entsperren
        </Btn>
      </form>
    </div>
  );
}
