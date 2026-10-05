import "server-only";
import { assertPublicUrl } from "./net";

interface LhAudit {
  id: string;
  title: string;
  score: number | null;
  displayValue?: string;
  details?: { type?: string; overallSavingsMs?: number };
  metricSavings?: Record<string, number>;
}
interface LhCategory {
  score: number | null;
  auditRefs: { id: string; weight: number }[];
}
interface PsiResponse {
  loadingExperience?: {
    overall_category?: string;
    metrics?: Record<string, { percentile: number; category: string }>;
  };
  lighthouseResult?: {
    categories: Record<string, LhCategory>;
    audits: Record<string, LhAudit>;
  };
  error?: { message: string };
}

const pct = (score: number | null | undefined) => (score == null ? null : Math.round(score * 100));

/** Google PageSpeed Insights (Lighthouse + echte Nutzerdaten aus dem Chrome UX Report, falls vorhanden). */
export async function pagespeed(rawUrl: string, strategy: "mobile" | "desktop" = "mobile") {
  const url = await assertPublicUrl(rawUrl);
  const params = new URLSearchParams({ url: url.toString(), strategy, locale: "de" });
  for (const c of ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"]) params.append("category", c);
  if (process.env.GOOGLE_API_KEY) params.set("key", process.env.GOOGLE_API_KEY);

  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
    signal: AbortSignal.timeout(90_000),
  });
  const data = (await res.json()) as PsiResponse;
  if (!res.ok || !data.lighthouseResult) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(
      res.status === 429
        ? "PageSpeed-Kontingent erschöpft – einen GOOGLE_API_KEY mit aktivierter PageSpeed Insights API hinterlegen."
        : `PageSpeed-Fehler: ${msg}`,
    );
  }

  const { categories, audits } = data.lighthouseResult;
  const metric = (id: string) => audits[id]?.displayValue ?? null;
  const failing = (cat: string, limit: number) =>
    (categories[cat]?.auditRefs ?? [])
      .map((r) => audits[r.id])
      .filter((a): a is LhAudit => Boolean(a) && a.score !== null && a.score < 0.9)
      .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
      .slice(0, limit)
      .map((a) => (a.displayValue ? `${a.title} (${a.displayValue})` : a.title));

  const field = data.loadingExperience?.metrics;
  return {
    url: url.toString(),
    strategie: strategy,
    punkte: {
      performance: pct(categories.performance?.score),
      seo: pct(categories.seo?.score),
      barrierefreiheit: pct(categories.accessibility?.score),
      bestPractices: pct(categories["best-practices"]?.score),
    },
    laborwerte: {
      LCP: metric("largest-contentful-paint"),
      CLS: metric("cumulative-layout-shift"),
      TBT: metric("total-blocking-time"),
      FCP: metric("first-contentful-paint"),
      SpeedIndex: metric("speed-index"),
    },
    echteNutzerdaten: field
      ? {
          gesamt: data.loadingExperience?.overall_category ?? null,
          LCP_ms: field.LARGEST_CONTENTFUL_PAINT_MS ?? null,
          INP_ms: field.INTERACTION_TO_NEXT_PAINT ?? null,
          CLS_x100: field.CUMULATIVE_LAYOUT_SHIFT_SCORE ?? null,
        }
      : "Keine Felddaten (zu wenig Traffic für den Chrome UX Report).",
    verbesserungenPerformance: failing("performance", 8),
    problemeSeo: failing("seo", 8),
    problemeBarrierefreiheit: failing("accessibility", 8),
  };
}
