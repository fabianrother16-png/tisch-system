"use client";

import { Clock3, TrendingUp } from "lucide-react";
import { hashtagLine } from "@/lib/studio/format";
import type { ViralRating } from "@/lib/studio/types";
import { Badge, Bar, Card, CopyButton, List, ScoreRing } from "../ui";

const CATEGORY_LABEL: Record<keyof ViralRating["kategorien"], string> = {
  hook: "Hook (erste 2 s)",
  retention: "Retention & Tempo",
  mehrwert: "Mehrwert",
  emotion: "Emotion",
  trendFit: "Trend-Fit",
  cta: "Call-to-Action",
  technik: "Technik (Bild, Ton, Untertitel)",
};

export function RatingCard({ rating, action }: { rating: ViralRating; action?: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start gap-6">
          <ScoreRing score={rating.gesamt} size={120} label="Viral-Potenzial" />
          <div className="min-w-[220px] flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta-light">Viral-Check</p>
            <p className="mt-1 text-cream/85">{rating.urteil}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(CATEGORY_LABEL) as (keyof ViralRating["kategorien"])[]).map((k) => (
                <Bar key={k} label={CATEGORY_LABEL[k]} value={rating.kategorien[k]} />
              ))}
            </div>
          </div>
        </div>
        {action && <div className="mt-5 flex flex-wrap gap-2">{action}</div>}
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h4 className="mb-3 font-serif text-lg font-semibold text-emerald-200">Stärken</h4>
          <List items={rating.staerken} tone="good" />
          <h4 className="mb-3 mt-5 font-serif text-lg font-semibold text-red-200">Schwächen</h4>
          <List items={rating.schwaechen} tone="bad" />
        </Card>
        <Card>
          <h4 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
            <TrendingUp className="h-4 w-4 text-terracotta-light" /> So wird es besser
          </h4>
          <ul className="space-y-3">
            {rating.verbesserungen.map((v, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-start gap-2">
                  <Badge tone={v.prioritaet === "hoch" ? "danger" : v.prioritaet === "mittel" ? "warning" : "neutral"}>{v.prioritaet}</Badge>
                  <span className="font-medium">{v.was}</span>
                </div>
                <p className="mt-1 pl-1 text-xs text-cream/55">{v.warum}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-serif text-lg font-semibold">Fertig zum Posten</h4>
          <span className="inline-flex items-center gap-1.5 text-sm text-cream/60">
            <Clock3 className="h-4 w-4" /> {rating.besteZeit}
          </span>
        </div>
        <p className="whitespace-pre-line text-sm text-cream/85">{rating.caption}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-ink-700 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cream/45">TikTok</p>
            <p className="text-sm text-terracotta-light">{hashtagLine(rating.hashtagsTiktok)}</p>
            <div className="mt-3">
              <CopyButton text={`${rating.caption}\n\n${hashtagLine(rating.hashtagsTiktok)}`} label="Caption + Hashtags kopieren" />
            </div>
          </div>
          <div className="rounded-xl bg-ink-700 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cream/45">Instagram</p>
            <p className="text-sm text-terracotta-light">{hashtagLine(rating.hashtagsInstagram)}</p>
            <div className="mt-3">
              <CopyButton text={`${rating.caption}\n\n${hashtagLine(rating.hashtagsInstagram)}`} label="Caption + Hashtags kopieren" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
