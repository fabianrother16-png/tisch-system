"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SEGMENTS, routeCommand } from "@/lib/segments";
import type { SegmentSlug } from "@/lib/types";
import { SegmentIcon } from "./SegmentIcon";

const BEISPIELE = [
  "Schreib 10 TikTok-Hooks für unsere Pizzeria-Kundin",
  "Bau eine Landingpage für das Herbst-Brunch-Angebot",
  "SEO-Audit der Website und Top-5-Maßnahmen",
  "Antworten auf die neuen Google-Bewertungen",
  "Finde 15 Restaurants in Bielefeld ohne gute Website",
];

/** „Was sollen wir bauen?“ – Auftrag eintippen, Segment wird automatisch erkannt. */
export function CommandBar({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [clientId, setClientId] = useState("");
  const [override, setOverride] = useState<SegmentSlug | "">("");
  const detected = useMemo(() => routeCommand(text), [text]);
  const segment = override || detected;

  function go() {
    const auftrag = text.trim();
    if (!auftrag) return;
    const params = new URLSearchParams({ auftrag, start: "1" });
    if (clientId) params.set("kunde", clientId);
    router.push(`/segment/${segment}?${params}`);
  }

  return (
    <div className="card p-4 md:p-5">
      <label htmlFor="befehl" className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-terracotta" /> Was sollen wir bauen?
      </label>
      <textarea
        id="befehl"
        className="input min-h-[96px] resize-y text-base"
        placeholder={BEISPIELE[0]}
        maxLength={6000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go();
        }}
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <select className="input sm:max-w-[220px]" value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Kunde">
          <option value="">Ohne Kunde</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-cream-darker bg-cream/50 px-2 py-1">
          <SegmentIcon slug={segment} className="h-4 w-4 shrink-0 text-terracotta" />
          <select
            className="min-w-0 flex-1 bg-transparent py-1 text-sm font-medium focus:outline-none"
            value={override}
            onChange={(e) => setOverride(e.target.value as SegmentSlug | "")}
            aria-label="Segment"
          >
            <option value="">Automatisch: {SEGMENTS.find((s) => s.slug === detected)?.label}</option>
            {SEGMENTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary sm:ml-auto" onClick={go} disabled={!text.trim()}>
          Bauen <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {BEISPIELE.slice(1).map((b) => (
          <button key={b} className="chip hover:border-terracotta/50" onClick={() => setText(b)}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
