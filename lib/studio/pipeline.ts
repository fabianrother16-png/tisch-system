"use client";

// Ablaufsteuerung der Recherche-Pipeline. Läuft im Browser und speichert
// nach jedem Schritt in IndexedDB – ein Fehler oder Neuladen kostet daher
// nur den laufenden Schritt, nie die bisherigen (bezahlten) Ergebnisse.

import { aggregateCreators, computeDataTrends, creatorKey, profileStats, toPostInput } from "./analysis";
import { ApiError, mapLimit, runAi, runScrape } from "./api";
import { getOne, update } from "./db";
import { toBrief } from "./tasks";
import {
  RESEARCH_STEPS,
  type Client,
  type CreatorCandidate,
  type CreatorProfile,
  type Platform,
  type ResearchProject,
  type ResearchStepId,
  type SocialPost,
  type StepState,
} from "./types";

type Ctx = {
  client: Client;
  signal: AbortSignal;
  note: (text: string) => Promise<void>;
};

const running = new Map<string, AbortController>();

export function isPipelineRunning(projectId: string) {
  return running.has(projectId);
}

export function cancelPipeline(projectId: string) {
  running.get(projectId)?.abort();
}

async function patch(id: string, fn: (p: ResearchProject) => Partial<ResearchProject>) {
  return update("research", id, (p) => ({ ...p, ...fn(p) }));
}

async function setStep(id: string, step: ResearchStepId, state: Partial<StepState>) {
  await update("research", id, (p) => ({
    ...p,
    steps: { ...p.steps, [step]: { ...p.steps[step], ...state } },
  }));
}

async function load(id: string) {
  const project = await getOne("research", id);
  if (!project) throw new Error("Projekt nicht gefunden.");
  return project;
}

/**
 * Führt alle offenen Schritte ab `from` (oder ab dem ersten nicht fertigen)
 * nacheinander aus. Bricht beim ersten Fehler ab.
 */
export async function runPipeline(projectId: string, client: Client, from?: ResearchStepId) {
  if (running.has(projectId)) return;
  const controller = new AbortController();
  running.set(projectId, controller);
  try {
    const initial = await load(projectId);
    const startIndex = from
      ? RESEARCH_STEPS.indexOf(from)
      : RESEARCH_STEPS.findIndex((s) => initial.steps[s].status !== "done");
    if (startIndex < 0) return;

    for (const step of RESEARCH_STEPS.slice(startIndex)) {
      if (controller.signal.aborted) break;
      await setStep(projectId, step, { status: "running", startedAt: Date.now(), error: undefined, note: undefined });
      const ctx: Ctx = {
        client,
        signal: controller.signal,
        note: (text) => setStep(projectId, step, { note: text }),
      };
      try {
        await STEPS[step](projectId, ctx);
        await setStep(projectId, step, { status: "done", finishedAt: Date.now(), note: undefined });
      } catch (error) {
        const aborted = controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError");
        const message = aborted
          ? "Abgebrochen."
          : error instanceof ApiError || error instanceof Error
            ? error.message
            : "Unbekannter Fehler";
        await setStep(projectId, step, { status: "error", error: message, finishedAt: Date.now() });
        break;
      }
    }
  } finally {
    running.delete(projectId);
  }
}

/** Setzt Schritte, die nach einem Neuladen als "running" hängen geblieben sind, zurück. */
export async function recoverInterrupted(projectId: string) {
  if (running.has(projectId)) return;
  await update("research", projectId, (p) => {
    const steps = { ...p.steps };
    let changed = false;
    for (const s of RESEARCH_STEPS) {
      if (steps[s].status === "running") {
        steps[s] = { ...steps[s], status: "error", error: "Unterbrochen (Seite neu geladen). Bitte fortsetzen." };
        changed = true;
      }
    }
    return changed ? { ...p, steps } : p;
  });
}

const ownHandles = (client: Client) =>
  new Set(
    [client.handles.tiktok, client.handles.instagram]
      .map((h) => h.trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean),
  );

function splitKey(key: string): { platform: Platform; handle: string } {
  const [platform, ...rest] = key.split(":");
  return { platform: platform as Platform, handle: rest.join(":") };
}

function groupByAuthor(posts: SocialPost[]) {
  const map: Record<string, SocialPost[]> = {};
  for (const p of posts) {
    const key = creatorKey(p);
    (map[key] ??= []).push(p);
  }
  return map;
}

function fmtElapsed(sec: number) {
  return sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} min`;
}

/** Lädt Profil-Posts (inkl. Transkripte) für eine Liste von Accounts. */
async function scrapeProfiles(keys: string[], perProfile: number, project: ResearchProject, ctx: Ctx, label: string) {
  const tt = keys.map(splitKey).filter((k) => k.platform === "tiktok").map((k) => k.handle);
  const ig = keys.map(splitKey).filter((k) => k.platform === "instagram").map((k) => k.handle);
  const knownProfiles = project.profiles ?? {};
  const igMissingProfile = ig.filter((h) => knownProfiles[`instagram:${h}`]?.followers == null);
  const tick = (elapsed: number) => void ctx.note(`${label} … ${fmtElapsed(elapsed)}`);

  const [ttResult, igResult, igProfiles] = await Promise.allSettled([
    tt.length
      ? runScrape(
          { kind: "tiktok-profiles", handles: tt, perProfile, region: ctx.client.region, transcripts: project.settings.transkripte },
          { signal: ctx.signal, onTick: tick },
        )
      : Promise.resolve(null),
    ig.length
      ? runScrape(
          { kind: "instagram-reels", handles: ig, perProfile, transcripts: project.settings.transkripte },
          { signal: ctx.signal, onTick: tick },
        )
      : Promise.resolve(null),
    igMissingProfile.length
      ? runScrape({ kind: "instagram-profiles", handles: igMissingProfile }, { signal: ctx.signal })
      : Promise.resolve(null),
  ]);
  if (ctx.signal.aborted) throw new DOMException("Abgebrochen", "AbortError");

  const posts: SocialPost[] = [];
  const profiles: Record<string, CreatorProfile> = {};
  const errors: string[] = [];
  for (const result of [ttResult, igResult, igProfiles]) {
    if (result.status === "rejected") {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      continue;
    }
    if (!result.value) continue;
    posts.push(...(result.value.posts ?? []));
    for (const p of result.value.profiles ?? []) profiles[p.key] = p;
  }
  return { posts, profiles, errors };
}

// ---------------------------------------------------------------------------

const STEPS: Record<ResearchStepId, (id: string, ctx: Ctx) => Promise<void>> = {
  async plan(id, ctx) {
    const project = await load(id);
    const plan = await runAi("plan", { client: toBrief(ctx.client), thema: project.settings.thema }, ctx.signal);
    await patch(id, () => ({ plan }));
  },

  async discover(id, ctx) {
    const project = await load(id);
    const plan = project.plan!;
    const region = ctx.client.region;
    const want = project.settings.plattformen;
    const counts: Record<string, number> = {};
    const tick = (label: string) => (elapsed: number) => {
      counts[label] = elapsed;
      void ctx.note(`Suche läuft auf ${Object.keys(counts).join(" & ")} … ${fmtElapsed(Math.max(...Object.values(counts)))}`);
    };

    const jobs: Promise<{ label: string; trend: boolean; posts: SocialPost[]; profiles: CreatorProfile[] }>[] = [];
    if (want.includes("tiktok")) {
      jobs.push(
        runScrape(
          { kind: "tiktok-search", queries: plan.tiktokSuchbegriffe.slice(0, 5), perQuery: 25, region, recent: false },
          { signal: ctx.signal, onTick: tick("TikTok") },
        ).then((r) => ({ label: "TikTok", trend: false, posts: r.posts ?? [], profiles: r.profiles ?? [] })),
      );
      if (plan.trendSuchbegriffe.length) {
        jobs.push(
          runScrape(
            { kind: "tiktok-search", queries: plan.trendSuchbegriffe.slice(0, 3), perQuery: 15, region, recent: true },
            { signal: ctx.signal, onTick: tick("TikTok-Trends") },
          ).then((r) => ({ label: "TikTok-Trends", trend: true, posts: r.posts ?? [], profiles: r.profiles ?? [] })),
        );
      }
    }
    if (want.includes("instagram")) {
      jobs.push(
        runScrape(
          { kind: "instagram-hashtags", hashtags: plan.instagramHashtags.slice(0, 5), perTag: 25 },
          { signal: ctx.signal, onTick: tick("Instagram") },
        ).then((r) => ({ label: "Instagram", trend: false, posts: r.posts ?? [], profiles: [] })),
      );
    }

    const results = await Promise.allSettled(jobs);
    if (ctx.signal.aborted) throw new DOMException("Abgebrochen", "AbortError");
    const discovered: SocialPost[] = [];
    const trendPosts: SocialPost[] = [];
    const profiles: Record<string, CreatorProfile> = { ...(project.profiles ?? {}) };
    const errors: string[] = [];
    for (const r of results) {
      if (r.status === "rejected") {
        errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
        continue;
      }
      (r.value.trend ? trendPosts : discovered).push(...r.value.posts.map((p) => ({ ...p, source: r.value.trend ? ("trend" as const) : p.source })));
      for (const prof of r.value.profiles) profiles[prof.key] = prof;
    }
    if (!discovered.length) {
      throw new Error(errors[0] ?? "Keine Videos gefunden. Bitte Branche/Thema konkreter formulieren.");
    }
    await patch(id, () => ({ discovered, trendPosts, profiles }));
    const tt = discovered.filter((p) => p.platform === "tiktok").length;
    const ig = discovered.filter((p) => p.platform === "instagram").length;
    await ctx.note(`${tt} TikToks und ${ig} Reels gefunden${errors.length ? ` (Hinweis: ${errors[0]})` : ""}`);
  },

  async select(id, ctx) {
    let project = await load(id);
    const own = ownHandles(ctx.client);
    const rank = () =>
      aggregateCreators(project.discovered ?? [], project.profiles ?? {}).filter((c) => !own.has(c.handle));
    let ranked = rank();

    // Instagram-Suchtreffer haben keine Follower/Bio – für die besten
    // Kandidaten nachladen, damit die Auswahl fundiert ist.
    const igTop = ranked
      .filter((c) => c.platform === "instagram" && c.followers == null)
      .slice(0, 15)
      .map((c) => c.handle);
    if (igTop.length) {
      await ctx.note("Lade Instagram-Profildaten der Top-Kandidaten …");
      try {
        const result = await runScrape({ kind: "instagram-profiles", handles: igTop }, { signal: ctx.signal });
        const merged = { ...(project.profiles ?? {}) };
        for (const p of result.profiles ?? []) merged[p.key] = p;
        project = (await patch(id, () => ({ profiles: merged }))) ?? project;
        ranked = rank();
      } catch (error) {
        if (ctx.signal.aborted) throw error;
        // Ohne Profildaten weiter – die Auswahl funktioniert auch mit Post-Daten.
      }
    }

    const top = pickCandidates(ranked, 30);
    if (!top.length) throw new Error("Keine Kandidaten gefunden.");
    await ctx.note(`KI prüft ${top.length} Kandidaten …`);
    const selection = await runAi(
      "select",
      {
        client: toBrief(ctx.client),
        plan: project.plan!,
        anzahl: project.settings.konkurrenten,
        candidates: top.map((c) => ({
          key: c.key,
          platform: c.platform,
          handle: c.handle,
          name: c.name,
          followers: c.followers,
          bio: c.bio?.slice(0, 500),
          postCount: c.postCount,
          medianViews: c.medianViews,
          maxViews: c.maxViews,
          engagementRate: c.engagementRate,
          score: c.score,
          beispiele: c.topPosts.slice(0, 3).map((p) => p.caption.slice(0, 380) || "(ohne Caption)"),
        })),
      },
      ctx.signal,
    );

    const valid = new Set(top.map((c) => c.key));
    const main = valid.has(selection.hauptkonkurrent.key) ? selection.hauptkonkurrent : { key: top[0].key, begruendung: "Höchster Score" };
    const weitere = selection.weitere
      .filter((w) => valid.has(w.key) && w.key !== main.key)
      .filter((w, i, arr) => arr.findIndex((x) => x.key === w.key) === i)
      .slice(0, project.settings.konkurrenten);
    await patch(id, () => ({ candidates: top, selection: { ...selection, hauptkonkurrent: main, weitere } }));
  },

  async main(id, ctx) {
    let project = await load(id);
    const key = project.selection!.hauptkonkurrent.key;
    if (!project.mainPosts?.length) {
      const { posts, profiles, errors } = await scrapeProfiles([key], 30, project, ctx, `Lade Videos von @${splitKey(key).handle}`);
      const mine = posts.filter((p) => creatorKey(p) === key);
      if (!mine.length) throw new Error(errors[0] ?? "Profil konnte nicht geladen werden (privat oder nicht gefunden).");
      project = (await patch(id, (p) => ({ mainPosts: mine, profiles: { ...(p.profiles ?? {}), ...profiles } }))) ?? project;
    }
    const posts = project.mainPosts!;
    const stats = profileStats(posts);
    const profile = profileFor(project, key, posts);
    await ctx.note(`KI analysiert ${posts.length} Videos …`);
    const mainAnalysis = await runAi(
      "analyzeMain",
      {
        client: toBrief(ctx.client),
        profile,
        stats,
        posts: [...posts].sort((a, b) => b.views - a.views).slice(0, 30).map((p) => toPostInput(p, 1500)),
      },
      ctx.signal,
    );
    await patch(id, () => ({ mainAnalysis }));
  },

  async draft(id, ctx) {
    const project = await load(id);
    const draft = await runAi(
      "draft",
      {
        client: toBrief(ctx.client),
        thema: project.settings.thema,
        konkurrent: splitKey(project.selection!.hauptkonkurrent.key).handle,
        analyse: project.mainAnalysis!,
      },
      ctx.signal,
    );
    await patch(id, () => ({ draft }));
  },

  async competitors(id, ctx) {
    let project = await load(id);
    const keys = project.selection!.weitere.map((w) => w.key);
    if (!keys.length) {
      await ctx.note("Keine weiteren Konkurrenten ausgewählt.");
      return;
    }

    const missing = keys.filter((k) => !project.competitorPosts?.[k]?.length);
    if (missing.length) {
      const { posts, profiles, errors } = await scrapeProfiles(missing, 15, project, ctx, `Lade Videos von ${missing.length} Konkurrenten`);
      const grouped = groupByAuthor(posts);
      project =
        (await patch(id, (p) => ({
          competitorPosts: { ...(p.competitorPosts ?? {}), ...Object.fromEntries(missing.map((k) => [k, grouped[k] ?? []])) },
          profiles: { ...(p.profiles ?? {}), ...profiles },
        }))) ?? project;
      if (!posts.length && errors.length) throw new Error(errors[0]);
    }

    const todo = keys.filter((k) => !project.competitorAnalyses?.[k] && (project.competitorPosts?.[k]?.length ?? 0) > 0);
    let done = keys.length - todo.length;
    await ctx.note(`KI analysiert Konkurrenten … ${done}/${keys.length}`);
    const results = await mapLimit(todo, 4, async (key) => {
      const posts = project.competitorPosts![key];
      const analysis = await runAi(
        "analyzeCompetitor",
        {
          client: toBrief(ctx.client),
          profile: profileFor(project, key, posts),
          stats: profileStats(posts),
          posts: [...posts].sort((a, b) => b.views - a.views).slice(0, 15).map((p) => toPostInput(p, 1000)),
        },
        ctx.signal,
      );
      await patch(id, (p) => ({ competitorAnalyses: { ...(p.competitorAnalyses ?? {}), [key]: analysis } }));
      done++;
      await ctx.note(`KI analysiert Konkurrenten … ${done}/${keys.length}`);
      return analysis;
    });
    if (ctx.signal.aborted) throw new DOMException("Abgebrochen", "AbortError");

    project = await load(id);
    const analysed = keys.filter((k) => project.competitorAnalyses?.[k]);
    if (!analysed.length) {
      const failure = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      throw new Error(failure?.reason instanceof Error ? failure.reason.message : "Keine Konkurrenz-Analyse möglich.");
    }

    await ctx.note("KI sucht Muster über alle Konkurrenten …");
    const mainKey = project.selection!.hauptkonkurrent.key;
    const synthesis = await runAi(
      "synthesize",
      {
        client: toBrief(ctx.client),
        haupt: { handle: splitKey(mainKey).handle, analyse: project.mainAnalysis!, stats: profileStats(project.mainPosts ?? []) },
        konkurrenten: analysed.map((k) => ({
          handle: splitKey(k).handle,
          analyse: project.competitorAnalyses![k],
          stats: profileStats(project.competitorPosts![k]),
        })),
      },
      ctx.signal,
    );
    await patch(id, () => ({ synthesis }));
  },

  async trends(id, ctx) {
    const project = await load(id);
    const allPosts = [
      ...(project.discovered ?? []),
      ...(project.mainPosts ?? []),
      ...Object.values(project.competitorPosts ?? {}).flat(),
    ];
    const dataTrends = computeDataTrends(allPosts, project.trendPosts ?? []);
    await patch(id, () => ({ dataTrends }));
    await ctx.note("Web-Recherche zu aktuellen Trends + Auswertung der Plattform-Daten …");
    const trends = await runAi(
      "trends",
      {
        client: toBrief(ctx.client),
        nische: project.plan!.nische,
        suchbegriffe: [...project.plan!.tiktokSuchbegriffe, ...project.plan!.trendSuchbegriffe].slice(0, 12),
        webRecherche: true,
        datenTrends: {
          ...dataTrends,
          hashtags: dataTrends.hashtags.slice(0, 30),
          sounds: dataTrends.sounds.slice(0, 20),
          recentViral: dataTrends.recentViral.slice(0, 12).map((p) => toPostInput(p, 600)),
        },
      },
      ctx.signal,
    );
    await patch(id, () => ({ trends }));
  },

  async final(id, ctx) {
    const project = await load(id);
    const final = await runAi(
      "final",
      {
        client: toBrief(ctx.client),
        thema: project.settings.thema,
        entwurf: project.draft!,
        hauptAnalyse: project.mainAnalysis!,
        synthese: project.synthesis ?? null,
        trends: project.trends ? { zusammenfassung: project.trends.zusammenfassung, trends: project.trends.trends, vermeiden: project.trends.vermeiden } : null,
        konkurrenten: Object.entries(project.competitorAnalyses ?? {}).map(([k, analyse]) => ({ handle: splitKey(k).handle, analyse })),
      },
      ctx.signal,
    );
    await patch(id, () => ({ final }));
  },
};

/** Top-N nach Score, aber jede Plattform mit mindestens ein paar Kandidaten. */
function pickCandidates(ranked: CreatorCandidate[], n: number) {
  const chosen = new Map<string, CreatorCandidate>();
  for (const platform of ["tiktok", "instagram"] as Platform[]) {
    ranked
      .filter((c) => c.platform === platform)
      .slice(0, 6)
      .forEach((c) => chosen.set(c.key, c));
  }
  for (const c of ranked) {
    if (chosen.size >= n) break;
    chosen.set(c.key, c);
  }
  return [...chosen.values()].sort((a, b) => b.score - a.score).slice(0, n);
}

function profileFor(project: ResearchProject, key: string, posts: SocialPost[]) {
  const { platform, handle } = splitKey(key);
  const known = project.profiles?.[key];
  return {
    key,
    platform,
    handle,
    name: known?.name ?? posts[0]?.authorName,
    followers: known?.followers ?? posts.find((p) => p.followers != null)?.followers,
    bio: known?.bio?.slice(0, 1000),
    verified: known?.verified,
  };
}
