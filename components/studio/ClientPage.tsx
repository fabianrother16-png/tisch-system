"use client";

import { Clapperboard, FileText, Radar, Scissors, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { newClient } from "@/lib/studio/clients";
import { put, removeClientCascade, useCollection, useRecord } from "@/lib/studio/db";
import { fmtDateTime } from "@/lib/studio/format";
import { createResearch, createVideo, STEP_LABEL } from "@/lib/studio/projects";
import {
  GOAL_LABEL,
  PLATFORM_LABEL,
  RESEARCH_STEPS,
  type Client,
  type Platform,
  type ResearchProject,
  type Script,
  type VideoProject,
} from "@/lib/studio/types";
import { ClientForm } from "./ClientForm";
import { ContentPlanPanel } from "./power/ContentPlanPanel";
import { HookLabPanel } from "./power/HookLabPanel";
import { Badge, Btn, Card, Empty, Field, Modal, SectionTitle, Tabs, TextInput, Toggle, cx } from "./ui";

type Tab = "recherche" | "videos" | "plan" | "hooks" | "profil";

export function ClientPage({ id }: { id: string }) {
  const router = useRouter();
  if (id === "neu") {
    return (
      <div className="mx-auto max-w-4xl">
        <SectionTitle eyebrow="Neuer Kunde" title="Kunde anlegen">
          Diese Angaben nutzt die KI bei jeder Recherche, jedem Skript und jedem Video.
        </SectionTitle>
        <ClientForm
          initial={newClient()}
          saveLabel="Kunde anlegen"
          onCancel={() => router.push("/studio")}
          onSave={async (c) => {
            await put("clients", c);
            router.push(`/studio/kunde/${c.id}`);
          }}
        />
      </div>
    );
  }
  return <ExistingClient id={id} />;
}

function ExistingClient({ id }: { id: string }) {
  const client = useRecord("clients", id);
  const research = useCollection("research", id);
  const videos = useCollection("videos", id);
  const [tab, setTab] = useState<Tab>("recherche");

  if (client === undefined) return null;
  if (client === null) {
    return (
      <Empty title="Kunde nicht gefunden" action={<Link href="/studio" className="text-terracotta-light underline">Zur Übersicht</Link>}>
        Die Daten liegen lokal in diesem Browser. Auf einem anderen Gerät bitte über Einstellungen → Import übertragen.
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold"
          style={{ background: client.brand.primary, color: client.brand.accent }}
        >
          {client.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-3xl font-semibold">{client.name}</h1>
          <p className="text-sm text-cream/55">
            {client.branche}
            {client.stadt ? ` · ${client.stadt}` : ""} · Zielgruppe: {client.zielgruppe || "alle"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{GOAL_LABEL[client.ziel]}</Badge>
          {client.plattformen.map((p) => (
            <Badge key={p} tone="accent">
              {PLATFORM_LABEL[p]}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "recherche", label: "Recherche & Skripte", count: research?.length },
          { id: "videos", label: "Videos", count: videos?.length },
          { id: "plan", label: "Content-Plan" },
          { id: "hooks", label: "Hook-Lab" },
          { id: "profil", label: "Profil & Brand-Kit" },
        ]}
      />

      {tab === "recherche" && <ResearchTab client={client} research={research ?? []} />}
      {tab === "videos" && <VideosTab client={client} videos={videos ?? []} research={research ?? []} />}
      {tab === "plan" && <ContentPlanPanel client={client} research={research ?? []} />}
      {tab === "hooks" && <HookLabPanel client={client} research={research ?? []} />}
      {tab === "profil" && <ProfileTab client={client} />}
    </div>
  );
}

function ResearchTab({ client, research }: { client: Client; research: ResearchProject[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <SectionTitle
        title="Recherchen"
        action={
          <Btn icon={<Radar className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Neue Recherche starten
          </Btn>
        }
      >
        Konkurrenz finden → Hauptkonkurrent analysieren → Entwurf → 10 weitere Konkurrenten → Trends → fertiges Skript.
      </SectionTitle>
      {research.length === 0 ? (
        <Empty
          icon={<Radar className="h-8 w-8" />}
          title="Noch keine Recherche"
          action={<Btn onClick={() => setOpen(true)}>Jetzt starten</Btn>}
        >
          Das Studio sucht auf TikTok und Instagram nach den erfolgreichsten Accounts für „{client.branche}“ und baut daraus dein Skript.
        </Empty>
      ) : (
        <div className="grid gap-3">
          {research.map((r) => {
            const done = RESEARCH_STEPS.filter((s) => r.steps[s].status === "done").length;
            const running = RESEARCH_STEPS.find((s) => r.steps[s].status === "running");
            const failed = RESEARCH_STEPS.find((s) => r.steps[s].status === "error");
            return (
              <Link key={r.id} href={`/studio/recherche/${r.id}`}>
                <Card className="flex flex-wrap items-center gap-4 transition-colors hover:border-terracotta/40">
                  <FileText className="h-5 w-5 text-terracotta-light" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="text-xs text-cream/45">
                      {fmtDateTime(r.createdAt)} · {done}/{RESEARCH_STEPS.length} Schritte
                    </p>
                  </div>
                  {r.final ? (
                    <Badge tone="success">Skript fertig</Badge>
                  ) : failed ? (
                    <Badge tone="danger">Fehler: {STEP_LABEL[failed]}</Badge>
                  ) : running ? (
                    <Badge tone="warning">{STEP_LABEL[running]}</Badge>
                  ) : (
                    <Badge>Pausiert</Badge>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <NewResearchModal client={client} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function NewResearchModal({ client, open, onClose }: { client: Client; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [thema, setThema] = useState("");
  const [plattformen, setPlattformen] = useState<Platform[]>(client.plattformen);
  const [konkurrenten, setKonkurrenten] = useState(10);
  const [transkripte, setTranskripte] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Neue Recherche">
      <div className="space-y-5">
        <Field label="Thema (optional)" hint='Leer lassen = die KI wählt das Thema mit dem größten Potenzial. Beispiel: "Wasserschaden am Dach"'>
          {(id) => <TextInput id={id} value={thema} onChange={(e) => setThema(e.target.value)} placeholder="Worum soll das Video gehen?" />}
        </Field>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/60">Plattformen durchsuchen</p>
          <div className="flex gap-2">
            {(["tiktok", "instagram"] as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={plattformen.includes(p)}
                onClick={() => setPlattformen((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm font-medium",
                  plattformen.includes(p) ? "border-terracotta bg-terracotta/15" : "border-cream/10 text-cream/55",
                )}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <Field label={`Weitere Konkurrenten analysieren: ${konkurrenten}`}>
          {(id) => (
            <input
              id={id}
              type="range"
              min={3}
              max={10}
              value={konkurrenten}
              onChange={(e) => setKonkurrenten(Number(e.target.value))}
              className="accent-terracotta"
            />
          )}
        </Field>
        <Toggle
          checked={transkripte}
          onChange={setTranskripte}
          label="Videos transkribieren"
          hint="Die KI liest mit, was in den Videos gesagt wird. Genauere Hook-Analyse, etwas höhere Scraper-Kosten."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="ghost" onClick={onClose}>
            Abbrechen
          </Btn>
          <Btn
            loading={busy}
            disabled={!plattformen.length}
            onClick={async () => {
              setBusy(true);
              const project = await createResearch(client, { thema: thema.trim(), plattformen, konkurrenten, transkripte });
              router.push(`/studio/recherche/${project.id}?start=1`);
            }}
          >
            Recherche starten
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export type ScriptOption = { key: string; label: string; detail: string; script: Script; researchId?: string };

export function collectScripts(research: ResearchProject[], plans: { ideen: { titel: string; script?: Script }[] }[] = []) {
  const options: ScriptOption[] = [];
  for (const r of research) {
    if (r.final) options.push({ key: `${r.id}-final`, label: r.final.titel, detail: `Finales Skript · ${r.title}`, script: r.final, researchId: r.id });
    if (r.draft) options.push({ key: `${r.id}-draft`, label: r.draft.titel, detail: `Entwurf · ${r.title}`, script: r.draft, researchId: r.id });
  }
  for (const p of plans) {
    for (const idea of p.ideen) {
      if (idea.script) options.push({ key: `${idea.titel}-${options.length}`, label: idea.script.titel, detail: `Content-Plan · ${idea.titel}`, script: idea.script });
    }
  }
  return options;
}

function VideosTab({ client, videos, research }: { client: Client; videos: VideoProject[]; research: ResearchProject[] }) {
  const router = useRouter();
  const plans = useCollection("plans", client.id);
  const [picker, setPicker] = useState(false);
  const scripts = collectScripts(research, plans ?? []);

  const startUpload = async () => {
    const v = await createVideo(client, { mode: "upload", title: "Eigene Clips" });
    router.push(`/studio/video/${v.id}`);
  };

  return (
    <section>
      <SectionTitle
        title="Videos"
        action={
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" icon={<Scissors className="h-4 w-4" />} onClick={startUpload}>
              Eigene Clips schneiden
            </Btn>
            <Btn icon={<Wand2 className="h-4 w-4" />} onClick={() => setPicker(true)}>
              KI-Video aus Skript
            </Btn>
          </div>
        }
      >
        KI-Video aus einem fertigen Skript erzeugen oder eigene Aufnahmen hochladen. Das Studio schneidet, setzt Hook und Untertitel und
        bewertet das Ergebnis.
      </SectionTitle>
      {videos.length === 0 ? (
        <Empty icon={<Clapperboard className="h-8 w-8" />} title="Noch keine Videos">
          Tipp: Erst eine Recherche durchlaufen lassen, dann aus dem fertigen Skript ein KI-Video erzeugen oder deine eigenen Clips
          dazu hochladen.
        </Empty>
      ) : (
        <VideoList videos={videos} />
      )}
      <Modal open={picker} onClose={() => setPicker(false)} title="Welches Skript soll verfilmt werden?" wide>
        {scripts.length === 0 ? (
          <Empty title="Noch kein Skript vorhanden">Starte zuerst eine Recherche oder erstelle Skripte im Content-Plan.</Empty>
        ) : (
          <div className="grid gap-2">
            {scripts.map((s) => (
              <button
                key={s.key}
                className="flex items-center gap-3 rounded-xl bg-ink-700 px-4 py-3 text-left hover:bg-ink-600"
                onClick={async () => {
                  const v = await createVideo(client, { mode: "ai", script: s.script, researchId: s.researchId });
                  router.push(`/studio/video/${v.id}`);
                }}
              >
                <Wand2 className="h-4 w-4 shrink-0 text-terracotta-light" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.label}</span>
                  <span className="block truncate text-xs text-cream/50">{s.detail}</span>
                </span>
                <Badge tone={s.script.viralScore >= 70 ? "success" : "warning"}>Score {Math.round(s.script.viralScore)}</Badge>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </section>
  );
}

export function VideoList({ videos, clientName }: { videos: VideoProject[]; clientName?: (id: string) => string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => {
        const lastRender = v.renders[v.renders.length - 1];
        return (
          <Link key={v.id} href={`/studio/video/${v.id}`}>
            <Card className="h-full transition-colors hover:border-terracotta/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.title}</p>
                  <p className="text-xs text-cream/45">
                    {clientName ? `${clientName(v.clientId)} · ` : ""}
                    {v.mode === "ai" ? "KI-Video" : "Eigene Clips"} · {fmtDateTime(v.updatedAt)}
                  </p>
                </div>
                {lastRender?.rating ? (
                  <Badge tone={lastRender.rating.gesamt >= 70 ? "success" : lastRender.rating.gesamt >= 50 ? "warning" : "danger"}>
                    {Math.round(lastRender.rating.gesamt)}/100
                  </Badge>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={v.status === "fertig" || v.status === "gepostet" ? "success" : "neutral"}>{v.status}</Badge>
                <Badge>{v.sources.length} Clips</Badge>
                {v.renders.length > 0 && <Badge tone="accent">{v.renders.length} Export(e)</Badge>}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function ProfileTab({ client }: { client: Client }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  return (
    <section className="space-y-6">
      <ClientForm
        key={client.updatedAt}
        initial={client}
        onSave={async (c) => {
          await put("clients", c);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        saveLabel={saved ? "Gespeichert ✓" : "Änderungen speichern"}
      />
      <Card className="border-red-400/20">
        <h3 className="font-serif text-lg font-semibold text-red-200">Kunde löschen</h3>
        <p className="mt-1 text-sm text-cream/55">Löscht den Kunden mit allen Recherchen, Plänen, Videos und Mediendateien auf diesem Gerät.</p>
        <Btn
          className="mt-4"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={async () => {
            if (!window.confirm(`"${client.name}" mit allen Daten unwiderruflich löschen?`)) return;
            await removeClientCascade(client.id);
            router.push("/studio");
          }}
        >
          Endgültig löschen
        </Btn>
      </Card>
    </section>
  );
}
