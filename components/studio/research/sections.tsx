"use client";

import { ExternalLink, Eye, Heart, MessageCircle, Repeat2, Bookmark, Crown, Hash, Music2 } from "lucide-react";
import { useState } from "react";
import { profileStats } from "@/lib/studio/analysis";
import { fmtNum, fmtPct, fmtSec } from "@/lib/studio/format";
import type { SearchPlan } from "@/lib/studio/schemas";
import { PLATFORM_LABEL, type ResearchProject, type SocialPost } from "@/lib/studio/types";
import { Badge, Bar, Card, List, SectionTitle, Stat, cx } from "../ui";

function findPost(project: ResearchProject, id: string): SocialPost | undefined {
  const pools = [
    project.mainPosts ?? [],
    ...Object.values(project.competitorPosts ?? {}),
    project.discovered ?? [],
    project.trendPosts ?? [],
  ];
  for (const pool of pools) {
    const hit = pool.find((p) => p.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function PostRef({ project, id }: { project: ResearchProject; id: string }) {
  const post = findPost(project, id);
  if (!post) return <code className="rounded bg-ink-600 px-1 text-xs">{id}</code>;
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded bg-ink-600 px-1.5 py-0.5 text-xs text-cream/80 hover:bg-ink-500"
    >
      {fmtNum(post.views)} Aufrufe <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function PostCard({ post, highlight }: { post: SocialPost; highlight?: string }) {
  const [imgOk, setImgOk] = useState(Boolean(post.thumbnail));
  return (
    <a href={post.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl bg-ink-700 hover:bg-ink-600">
      <div className="relative aspect-[9/12] bg-ink-600">
        {imgOk && post.thumbnail && (
          // Externe, signierte CDN-Bilder (TikTok/Instagram) – laufen ab und
          // lassen sich nicht über next/image optimieren.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 pt-8">
          <p className="flex items-center gap-1 text-sm font-semibold">
            <Eye className="h-3.5 w-3.5" /> {fmtNum(post.views)}
          </p>
          <p className="truncate text-xs text-cream/70">@{post.author}</p>
        </div>
        <Badge className="absolute left-2 top-2" tone="neutral">
          {PLATFORM_LABEL[post.platform]}
        </Badge>
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs text-cream/70">{post.caption || "(ohne Caption)"}</p>
        {highlight && <p className="mt-1.5 text-xs text-emerald-300/90">{highlight}</p>}
      </div>
    </a>
  );
}

function Metrics({ post }: { post: SocialPost }) {
  return (
    <span className="flex flex-wrap gap-3 text-xs text-cream/55">
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3 w-3" /> {fmtNum(post.views)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3 w-3" /> {fmtNum(post.likes)}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="h-3 w-3" /> {fmtNum(post.comments)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Repeat2 className="h-3 w-3" /> {fmtNum(post.shares)}
      </span>
      {post.saves > 0 && (
        <span className="inline-flex items-center gap-1">
          <Bookmark className="h-3 w-3" /> {fmtNum(post.saves)}
        </span>
      )}
      {post.durationSec ? <span>{fmtSec(post.durationSec)}</span> : null}
    </span>
  );
}

export function PlanSection({ plan }: { plan: SearchPlan }) {
  return (
    <div>
      <SectionTitle eyebrow="Schritt 1" title="Suchstrategie">
        {plan.nische}
      </SectionTitle>
      <Card className="grid gap-5 md:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/45">TikTok-Suche</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.tiktokSuchbegriffe.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/45">Instagram-Hashtags</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.instagramHashtags.map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/45">Trend-Suche</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.trendSuchbegriffe.map((t) => (
              <Badge key={t} tone="accent">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DiscoverSection({ project }: { project: ResearchProject }) {
  const posts = project.discovered ?? [];
  const top = [...posts].sort((a, b) => b.views - a.views).slice(0, 8);
  const tt = posts.filter((p) => p.platform === "tiktok").length;
  const ig = posts.filter((p) => p.platform === "instagram").length;
  const authors = new Set(posts.map((p) => `${p.platform}:${p.author}`)).size;
  return (
    <div>
      <SectionTitle eyebrow="Schritt 2" title="Gefunden auf TikTok & Instagram" />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="TikToks" value={tt} />
        <Stat label="Reels" value={ig} />
        <Stat label="Accounts" value={authors} />
        <Stat label="Trend-Videos" value={project.trendPosts?.length ?? 0} hint="letzte 4 Wochen" />
      </div>
      <p className="mb-3 text-sm text-cream/55">Die meistgesehenen Treffer:</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {top.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}

export function CandidatesSection({ project }: { project: ResearchProject }) {
  const sel = project.selection!;
  const chosen = new Map<string, string>([
    [sel.hauptkonkurrent.key, sel.hauptkonkurrent.begruendung],
    ...sel.weitere.map((w) => [w.key, w.begruendung] as [string, string]),
  ]);
  const rejected = new Map(sel.verworfen.map((v) => [v.key, v.grund]));
  return (
    <div>
      <SectionTitle eyebrow="Schritt 3" title="Die echte Konkurrenz">
        Kandidaten nach Score (Reichweite, Spitzenwerte, Engagement, Konstanz). Die KI hat geprüft, wer wirklich dieselbe Zielgruppe
        bespielt.
      </SectionTitle>
      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ink-700 text-[11px] uppercase tracking-wider text-cream/50">
              <tr>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Follower</th>
                <th className="px-4 py-2.5">Median-Aufrufe</th>
                <th className="px-4 py-2.5">Max</th>
                <th className="px-4 py-2.5">Engagement</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Urteil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/[0.06]">
              {project.candidates!.map((c) => {
                const isMain = c.key === sel.hauptkonkurrent.key;
                const reason = chosen.get(c.key);
                return (
                  <tr key={c.key} className={cx(isMain && "bg-terracotta/10", !reason && "opacity-60")}>
                    <td className="px-4 py-3">
                      <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:underline">
                        {isMain && <Crown className="h-3.5 w-3.5 text-amber-300" />}@{c.handle}
                      </a>
                      <span className="block text-xs text-cream/45">{PLATFORM_LABEL[c.platform]}</span>
                    </td>
                    <td className="px-4 py-3">{fmtNum(c.followers)}</td>
                    <td className="px-4 py-3">{fmtNum(c.medianViews)}</td>
                    <td className="px-4 py-3">{fmtNum(c.maxViews)}</td>
                    <td className="px-4 py-3">{fmtPct(c.engagementRate)}</td>
                    <td className="px-4 py-3 font-semibold">{c.score.toFixed(0)}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-cream/65">
                      {isMain ? (
                        <Badge tone="accent">Hauptkonkurrent</Badge>
                      ) : reason ? (
                        <Badge tone="success">Ausgewählt</Badge>
                      ) : rejected.get(c.key) ? (
                        <Badge tone="danger">Verworfen</Badge>
                      ) : null}
                      <span className="mt-1 block">{reason ?? rejected.get(c.key) ?? ""}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function MainSection({ project }: { project: ResearchProject }) {
  const a = project.mainAnalysis!;
  const key = project.selection!.hauptkonkurrent.key;
  const profile = project.profiles?.[key];
  const posts = project.mainPosts ?? [];
  const stats = profileStats(posts);
  const handle = key.split(":").slice(1).join(":");
  const best = [...posts].sort((x, y) => y.views - x.views).slice(0, 4);
  return (
    <div>
      <SectionTitle eyebrow="Schritt 4 · Hauptkonkurrent" title={<>@{handle}</>}>
        {profile?.bio ?? project.selection!.hauptkonkurrent.begruendung}
      </SectionTitle>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Follower" value={fmtNum(profile?.followers ?? posts[0]?.followers)} />
        <Stat label="Videos analysiert" value={stats.count} />
        <Stat label="Median-Aufrufe" value={fmtNum(stats.medianViews)} />
        <Stat label="Bestes Video" value={fmtNum(stats.maxViews)} />
        <Stat label="Engagement" value={fmtPct(stats.engagementRate)} />
        <Stat
          label="Rhythmus"
          value={stats.postsPerWeek != null ? `${stats.postsPerWeek.toLocaleString("de-DE", { maximumFractionDigits: 1 })}/Woche` : "–"}
          hint={stats.avgDuration ? `Ø ${Math.round(stats.avgDuration)} s lang` : undefined}
        />
      </div>
      <Card className="mb-5">
        <p className="text-cream/85">{a.kurzfazit}</p>
        <p className="mt-2 text-sm text-cream/55">{a.positionierung}</p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <EvidenceCard title="Warum so viele Aufrufe" items={a.warumVieleAufrufe} project={project} tone="neutral" />
        <EvidenceCard title="Was sie richtig machen" items={a.wasSieRichtigMachen} project={project} tone="good" />
        <EvidenceCard title="Was sie falsch machen" items={a.wasSieFalschMachen} project={project} tone="bad" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h4 className="mb-3 font-serif text-lg font-semibold">Hook-Muster</h4>
          <div className="space-y-3">
            {a.hookMuster.map((h, i) => (
              <div key={i} className="rounded-xl bg-ink-700 p-3">
                <p className="text-sm font-semibold">{h.muster}</p>
                <p className="mt-1 text-sm italic text-cream/70">„{h.beispiel}“</p>
                <p className="mt-1 text-xs text-cream/50">{h.wirkung}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 className="mb-3 font-serif text-lg font-semibold">Stil & Formate</h4>
          <dl className="space-y-2 text-sm">
            {(
              [
                ["Tonalität", a.stil.tonalitaet],
                ["Schnitt", a.stil.schnitt],
                ["Länge", a.stil.laenge],
                ["CTAs", a.stil.ctas],
                ["Rhythmus", a.stil.postingRhythmus],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="text-cream/45">{k}</dt>
                <dd className="text-cream/80">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 space-y-2">
            {a.formate.map((f, i) => (
              <p key={i} className="text-sm">
                <span className="font-semibold">{f.format}</span>{" "}
                <span className="text-cream/50">
                  · {f.haeufigkeit} · {f.performance}
                </span>
              </p>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h4 className="mb-3 font-serif text-lg font-semibold text-emerald-200">Top-Videos</h4>
          <ul className="space-y-3">
            {a.topVideos.map((v) => {
              const post = findPost(project, v.postId);
              return (
                <li key={v.postId} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <PostRef project={project} id={v.postId} />
                    {post && <Metrics post={post} />}
                  </div>
                  <p className="mt-1 text-cream/75">{v.warumErfolgreich}</p>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <h4 className="mb-3 font-serif text-lg font-semibold text-red-200">Flops</h4>
          <ul className="space-y-3">
            {a.flopVideos.map((v) => {
              const post = findPost(project, v.postId);
              return (
                <li key={v.postId} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <PostRef project={project} id={v.postId} />
                    {post && <Metrics post={post} />}
                  </div>
                  <p className="mt-1 text-cream/75">{v.warumSchwach}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Card className="mt-5 border-terracotta/30">
        <h4 className="mb-3 font-serif text-lg font-semibold text-terracotta-light">Chancen für uns</h4>
        <List items={a.chancenFuerUns} />
      </Card>
      {best.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {best.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceCard({
  title,
  items,
  project,
  tone,
}: {
  title: string;
  items: { punkt: string; beleg: string }[];
  project: ResearchProject;
  tone: "neutral" | "good" | "bad";
}) {
  return (
    <Card>
      <h4 className={cx("mb-3 font-serif text-lg font-semibold", tone === "good" && "text-emerald-200", tone === "bad" && "text-red-200")}>
        {title}
      </h4>
      <List
        tone={tone}
        items={items.map((e, i) => (
          <span key={i}>
            {e.punkt}
            <span className="mt-0.5 block text-xs text-cream/45">{linkifyIds(e.beleg, project)}</span>
          </span>
        ))}
      />
    </Card>
  );
}

/** Ersetzt Post-IDs (tt_…/ig_…) im Fließtext durch klickbare Verweise. */
function linkifyIds(text: string, project: ResearchProject) {
  const parts = text.split(/((?:tt|ig)_[A-Za-z0-9_-]+)/g);
  return parts.map((part, i) => (/^(tt|ig)_/.test(part) ? <PostRef key={i} project={project} id={part} /> : <span key={i}>{part}</span>));
}

export function CompetitorsSection({ project }: { project: ResearchProject }) {
  const sel = project.selection!;
  const s = project.synthesis;
  return (
    <div>
      <SectionTitle eyebrow="Schritt 6" title={`${sel.weitere.length} weitere Konkurrenten`}>
        Jeder Account einzeln analysiert, danach die Muster über alle hinweg.
      </SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {sel.weitere.map((w) => {
          const a = project.competitorAnalyses?.[w.key];
          const posts = project.competitorPosts?.[w.key] ?? [];
          const stats = posts.length ? profileStats(posts) : null;
          const profile = project.profiles?.[w.key];
          const [platform, ...rest] = w.key.split(":");
          return (
            <Card key={w.key}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={profile?.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="font-serif text-lg font-semibold hover:underline"
                  >
                    @{rest.join(":")}
                  </a>
                  <p className="text-xs text-cream/45">
                    {PLATFORM_LABEL[platform as "tiktok" | "instagram"]} · {fmtNum(profile?.followers ?? posts[0]?.followers)} Follower
                    {stats ? ` · Median ${fmtNum(stats.medianViews)} Aufrufe · ER ${fmtPct(stats.engagementRate)}` : ""}
                  </p>
                </div>
                {a && <Badge tone={a.bewertung >= 7 ? "success" : a.bewertung >= 5 ? "warning" : "danger"}>{a.bewertung}/10</Badge>}
              </div>
              {a ? (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-cream/75">{a.warumAufrufe}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300/80">Richtig</p>
                      <List items={a.richtig} tone="good" />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-300/80">Falsch</p>
                      <List items={a.falsch} tone="bad" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-ink-700 p-3">
                    <p className="text-xs text-cream/45">
                      Bester Hook <PostRef project={project} id={a.besterHook.postId} />
                    </p>
                    <p className="mt-1 italic">„{a.besterHook.text}“</p>
                  </div>
                  <p className="text-cream/75">
                    <span className="font-semibold text-terracotta-light">Für uns:</span> {a.uebertragbareIdee}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-cream/45">
                  {project.competitorPosts && !posts.length ? "Profil nicht abrufbar (privat oder umbenannt)." : "Wird analysiert …"}
                </p>
              )}
            </Card>
          );
        })}
      </div>
      {s && (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <Card>
            <h4 className="mb-3 font-serif text-lg font-semibold text-emerald-200">Erfolgsmuster</h4>
            <List
              tone="good"
              items={s.erfolgsmuster.map((m, i) => (
                <span key={i}>
                  <strong>{m.muster}</strong> <span className="text-cream/45">({m.verbreitung})</span>
                  <span className="block text-xs text-cream/60">{m.anwendung}</span>
                </span>
              ))}
            />
          </Card>
          <Card>
            <h4 className="mb-3 font-serif text-lg font-semibold text-red-200">Häufige Fehler</h4>
            <List
              tone="bad"
              items={s.haeufigeFehler.map((f, i) => (
                <span key={i}>
                  {f.fehler}
                  <span className="block text-xs text-cream/60">→ {f.besserMachen}</span>
                </span>
              ))}
            />
          </Card>
          <Card className="border-terracotta/30">
            <h4 className="mb-3 font-serif text-lg font-semibold text-terracotta-light">Content-Lücken</h4>
            <List
              items={s.contentLuecken.map((l, i) => (
                <span key={i}>
                  {l.luecke}
                  <span className="block text-xs text-cream/60">Idee: {l.idee}</span>
                </span>
              ))}
            />
          </Card>
          <Card className="lg:col-span-3">
            <h4 className="mb-3 font-serif text-lg font-semibold">Benchmarks der Nische</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Typische Länge" value={<span className="text-base">{s.benchmarks.typischeLaenge}</span>} />
              <Stat label="Hook-Dauer" value={<span className="text-base">{s.benchmarks.hookDauer}</span>} />
              <Stat label="Posting-Frequenz" value={<span className="text-base">{s.benchmarks.postingFrequenz}</span>} />
              <Stat label="Gute Performance" value={<span className="text-base">{s.benchmarks.gutePerformance}</span>} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function TrendsSection({ project }: { project: ResearchProject }) {
  const t = project.trends!;
  const d = project.dataTrends;
  const maxLen = Math.max(1, ...(d?.lengths.map((l) => l.medianViews) ?? [1]));
  const maxDay = Math.max(1, ...(d?.weekdays.map((l) => l.medianViews) ?? [1]));
  const typeLabel: Record<string, string> = {
    format: "Format",
    sound: "Sound",
    hook: "Hook",
    thema: "Thema",
    hashtag: "Hashtag",
    stil: "Stil",
  };
  return (
    <div>
      <SectionTitle eyebrow="Schritt 7" title="Trends">
        {t.zusammenfassung}
      </SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {[...t.trends]
          .sort((a, b) => b.passung - a.passung)
          .map((trend, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    <Badge tone="accent">{typeLabel[trend.typ] ?? trend.typ}</Badge>
                    <Badge>{trend.plattform === "beide" ? "TikTok & Instagram" : trend.plattform}</Badge>
                    <Badge>{trend.haltbarkeit}</Badge>
                  </div>
                  <p className="font-serif text-lg font-semibold">{trend.name}</p>
                </div>
                <div className="w-24 shrink-0">
                  <Bar value={trend.passung} label="Passung" />
                </div>
              </div>
              <p className="mt-2 text-sm text-cream/70">{trend.beschreibung}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-terracotta-light">So nutzen:</span> {trend.umsetzung}
              </p>
              <p className="mt-2 text-xs text-cream/40">Beleg: {linkifyIds(trend.beleg, project)}</p>
            </Card>
          ))}
      </div>
      {t.vermeiden.length > 0 && (
        <Card className="mt-5">
          <h4 className="mb-3 font-serif text-lg font-semibold text-red-200">Lieber vermeiden</h4>
          <List items={t.vermeiden} tone="bad" />
        </Card>
      )}
      {d && (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Card>
            <h4 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
              <Hash className="h-4 w-4 text-terracotta-light" /> Hashtags (Daten)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {d.hashtags
                .filter((h) => !h.generic)
                .slice(0, 18)
                .map((h) => (
                  <Badge key={h.tag} title={`${h.posts} Posts`}>
                    #{h.tag} · {fmtNum(h.views)}
                  </Badge>
                ))}
            </div>
          </Card>
          <Card>
            <h4 className="mb-3 font-serif text-lg font-semibold">Länge vs. Aufrufe</h4>
            <div className="space-y-2">
              {d.lengths.map((l) => (
                <div key={l.bucket} className="grid grid-cols-[80px_1fr_70px] items-center gap-2 text-xs">
                  <span className="text-cream/55">{l.bucket}</span>
                  <span className="h-2 rounded-full bg-ink-600">
                    <span className="block h-2 rounded-full bg-terracotta" style={{ width: `${(l.medianViews / maxLen) * 100}%` }} />
                  </span>
                  <span className="text-right text-cream/70">
                    {fmtNum(l.medianViews)} <span className="text-cream/35">({l.posts})</span>
                  </span>
                </div>
              ))}
            </div>
            <h4 className="mb-2 mt-5 text-sm font-semibold">Wochentage (Median)</h4>
            <div className="flex h-20 items-end gap-1.5">
              {d.weekdays.map((w) => (
                <div key={w.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-terracotta/80"
                    style={{ height: `${Math.max(4, (w.medianViews / maxDay) * 64)}px` }}
                    title={`${fmtNum(w.medianViews)} (${w.posts} Posts)`}
                  />
                  <span className="text-[10px] text-cream/45">{w.day}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h4 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
              <Music2 className="h-4 w-4 text-terracotta-light" /> Sounds (Daten)
            </h4>
            {d.sounds.length ? (
              <ul className="space-y-2 text-sm">
                {d.sounds.slice(0, 8).map((s) => (
                  <li key={`${s.platform}-${s.name}`}>
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-cream/45">
                      {s.author ? `${s.author} · ` : ""}
                      {s.posts} Posts · {fmtNum(s.views)} Aufrufe · {PLATFORM_LABEL[s.platform]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-cream/45">Kein Sound wird in der Nische mehrfach genutzt – Originalton/Voiceover dominiert.</p>
            )}
          </Card>
        </div>
      )}
      {t.quellen.length > 0 && (
        <Card className="mt-5">
          <h4 className="mb-2 text-sm font-semibold">Quellen der Web-Recherche</h4>
          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {t.quellen.map((q) => (
              <li key={q.url} className="truncate">
                <a href={q.url} target="_blank" rel="noreferrer" className="text-terracotta-light hover:underline">
                  {q.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
