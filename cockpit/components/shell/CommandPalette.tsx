"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { NAV } from "./nav";
import { cn } from "../ui/cn";

type Result = { type: string; label: string; sub?: string; href: string };

const TYPE_LABEL: Record<string, string> = {
  seite: "Seite",
  kunde: "Kunde",
  kontakt: "Kontakt",
  rechnung: "Rechnung",
  angebot: "Angebot",
  content: "Content",
  datei: "Datei",
  aufgabe: "Aufgabe",
  vertrag: "Vertrag",
};

const PAGES: Result[] = [
  ...NAV.flatMap((g) => g.items.map((i) => ({ type: "seite", label: i.label, href: i.href }))),
  { type: "seite", label: "Einstellungen", href: "/einstellungen" },
  { type: "seite", label: "Neuer Kunde", href: "/kunden/neu" },
  { type: "seite", label: "Neues Angebot", href: "/angebote/neu" },
  { type: "seite", label: "Neue Rechnung", href: "/rechnungen/neu" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          setResults(await res.json());
          setActive(0);
        }
      } catch {}
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => !term || p.label.toLowerCase().includes(term)).slice(0, term ? 4 : 8);
    return term.length >= 2 ? [...results, ...pages] : pages;
  }, [q, results]);

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    setResults([]);
    router.push(r.href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted shadow-xs transition-colors hover:border-line-strong"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Suchen: Kunden, Rechnungen, Dateien …</span>
        <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium sm:inline">Strg K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, items.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter" && items[active]) go(items[active]);
                }}
                placeholder="Wonach suchst du?"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Keine Treffer</li>}
              {items.map((r, i) => (
                <li key={`${r.type}-${r.href}-${i}`}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                      i === active ? "bg-surface-3" : "",
                    )}
                  >
                    <span className="w-16 shrink-0 text-[11px] font-medium text-muted uppercase">{TYPE_LABEL[r.type] ?? r.type}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-fg">{r.label}</span>
                      {r.sub && <span className="block truncate text-xs text-muted">{r.sub}</span>}
                    </span>
                    {i === active && <CornerDownLeft className="size-3.5 text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
