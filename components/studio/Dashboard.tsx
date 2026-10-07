"use client";

import { ArrowRight, Building2, Clapperboard, Plus, Radar, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useCollection } from "@/lib/studio/db";
import { fmtDateTime } from "@/lib/studio/format";
import { GOAL_LABEL } from "@/lib/studio/types";
import { useStudioStatus } from "./StudioShell";
import { Badge, Card, Empty, InfoNote, SectionTitle } from "./ui";

export function Dashboard() {
  const clients = useCollection("clients");
  const research = useCollection("research");
  const videos = useCollection("videos");
  const { status } = useStudioStatus();

  const recent = [
    ...(research ?? []).map((r) => ({ kind: "research" as const, id: r.id, title: r.title, clientId: r.clientId, at: r.updatedAt })),
    ...(videos ?? []).map((v) => ({ kind: "video" as const, id: v.id, title: v.title, clientId: v.clientId, at: v.updatedAt })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);
  const clientName = (id: string) => clients?.find((c) => c.id === id)?.name ?? "–";

  const missing = status
    ? [
        !status.claude && "ANTHROPIC_API_KEY (Claude – Analysen, Skripte, Schnittplan, Rating)",
        !status.apify && "APIFY_API_TOKEN (TikTok- & Instagram-Daten)",
        !status.elevenlabs && "ELEVENLABS_API_KEY (Sprecherstimme & automatische Untertitel)",
        !status.fal && "FAL_KEY (KI-Videoszenen)",
        status.passwordMissingInProduction && "STUDIO_PASSWORD (Zugangsschutz – in Produktion Pflicht)",
      ].filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-cream/[0.07] bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-6 sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-terracotta/20 blur-3xl" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-terracotta-light">SICHTWERK Studio</p>
        <h1 className="mt-2 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">
          Von der Konkurrenz-Analyse zum viralen Video. Am Stück.
        </h1>
        <p className="mt-4 max-w-2xl text-cream/65">
          Beruf und Zielgruppe eingeben. Das Studio findet die stärksten Accounts auf TikTok und Instagram, zerlegt, warum sie
          funktionieren, schreibt das Skript, produziert das Video und bewertet es, bevor du postest.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-4">
          {[
            { icon: <Radar className="h-5 w-5" />, t: "1 · Recherche", d: "Konkurrenz finden & analysieren" },
            { icon: <Sparkles className="h-5 w-5" />, t: "2 · Skript", d: "Entwurf → Trends → finales Skript" },
            { icon: <Wand2 className="h-5 w-5" />, t: "3 · Video", d: "KI-Video oder eigene Clips schneiden" },
            { icon: <Clapperboard className="h-5 w-5" />, t: "4 · Rating", d: "Viral-Score, Caption & Hashtags" },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl bg-ink-900/60 p-4">
              <div className="text-terracotta-light">{s.icon}</div>
              <p className="mt-2 text-sm font-semibold">{s.t}</p>
              <p className="text-xs text-cream/55">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {missing.length > 0 && (
        <InfoNote>
          <p className="font-semibold">Noch nicht alle Dienste verbunden:</p>
          <ul className="mt-1 list-inside list-disc text-amber-100/80">
            {missing.map((m) => (
              <li key={String(m)}>{m}</li>
            ))}
          </ul>
          <Link href="/studio/einstellungen" className="mt-2 inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
            Zur Einrichtung <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </InfoNote>
      )}

      <section>
        <SectionTitle
          eyebrow="Kunden"
          title="Für wen produzieren wir?"
          action={
            <Link
              href="/studio/kunde/neu"
              className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold hover:bg-terracotta-light"
            >
              <Plus className="h-4 w-4" /> Neuer Kunde
            </Link>
          }
        />
        {clients === null ? null : clients.length === 0 ? (
          <Empty
            icon={<Building2 className="h-8 w-8" />}
            title="Lege deinen ersten Kunden an"
            action={
              <Link href="/studio/kunde/neu" className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-semibold hover:bg-terracotta-light">
                Kunde anlegen
              </Link>
            }
          >
            Pro Kunde speicherst du Branche, Zielgruppe, Tonalität und Brand-Kit. Alle Recherchen, Skripte und Videos landen dann sauber
            getrennt beim jeweiligen Kunden.
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => {
              const rCount = research?.filter((r) => r.clientId === c.id).length ?? 0;
              const vCount = videos?.filter((v) => v.clientId === c.id).length ?? 0;
              return (
                <Link key={c.id} href={`/studio/kunde/${c.id}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-terracotta/40">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                        style={{ background: c.brand.primary, color: c.brand.accent }}
                      >
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-lg font-semibold">{c.name}</p>
                        <p className="truncate text-sm text-cream/55">
                          {c.branche}
                          {c.stadt ? ` · ${c.stadt}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{GOAL_LABEL[c.ziel]}</Badge>
                      <Badge tone="accent">{rCount} Recherchen</Badge>
                      <Badge tone="accent">{vCount} Videos</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <SectionTitle eyebrow="Zuletzt" title="Weiterarbeiten" />
          <Card className="divide-y divide-cream/[0.06] p-0 sm:p-0">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={item.kind === "research" ? `/studio/recherche/${item.id}` : `/studio/video/${item.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink-700"
              >
                <span className="text-terracotta-light">
                  {item.kind === "research" ? <Radar className="h-4 w-4" /> : <Clapperboard className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block text-xs text-cream/45">{clientName(item.clientId)}</span>
                </span>
                <span className="hidden text-xs text-cream/40 sm:block">{fmtDateTime(item.at)}</span>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
