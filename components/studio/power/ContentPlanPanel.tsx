"use client";

import { CalendarDays, Eye, FileText, Rocket, Scissors, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, mapLimit, runAi } from "@/lib/studio/api";
import { put, uid, update, useCollection } from "@/lib/studio/db";
import { createVideo, researchInsights } from "@/lib/studio/projects";
import { toBrief } from "@/lib/studio/tasks";
import {
  IDEA_STATUS_LABEL,
  type Client,
  type ContentIdea,
  type ContentPlan,
  type IdeaStatus,
  type ResearchProject,
} from "@/lib/studio/types";
import { autopilot } from "@/lib/studio/video/workflow";
import { ScriptView } from "../ScriptView";
import { useStudioStatus } from "../StudioShell";
import { useJob } from "../video/useJob";
import { Badge, Btn, Card, Empty, ErrorNote, Field, InfoNote, Modal, Progress, SectionTitle, Select, Spinner, cx } from "../ui";

const STATUS_TONE: Record<IdeaStatus, "neutral" | "accent" | "warning" | "success"> = {
  idee: "neutral",
  skript: "accent",
  video: "warning",
  fertig: "success",
  gepostet: "success",
};

export function ContentPlanPanel({ client, research }: { client: Client; research: ResearchProject[] }) {
  const plans = useCollection("plans", client.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const plan = plans?.find((p) => p.id === selectedId) ?? plans?.[0];

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Content-Plan & Serienproduktion"
        action={
          <div className="flex flex-wrap gap-2">
            {plans && plans.length > 1 && (
              <Select value={plan?.id} onChange={(e) => setSelectedId(e.target.value)} className="w-auto" aria-label="Plan wählen">
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            )}
            <Btn icon={<CalendarDays className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Neuen 30-Tage-Plan
            </Btn>
          </div>
        }
      >
        Ein ganzer Monat Content auf einmal: Ideen, Skripte und auf Knopfdruck fertige KI-Videos.
      </SectionTitle>
      {plans === null ? null : !plan ? (
        <Empty icon={<CalendarDays className="h-8 w-8" />} title="Noch kein Content-Plan" action={<Btn onClick={() => setCreating(true)}>Plan erstellen</Btn>}>
          Am besten auf Basis einer abgeschlossenen Recherche – dann stecken die Erfolgsmuster der Konkurrenz und die aktuellen Trends direkt
          in jeder Idee.
        </Empty>
      ) : (
        <PlanView plan={plan} client={client} research={research} />
      )}
      <NewPlanModal
        open={creating}
        onClose={() => setCreating(false)}
        client={client}
        research={research}
        onCreated={(id) => {
          setSelectedId(id);
          setCreating(false);
        }}
      />
    </section>
  );
}

function NewPlanModal({
  open,
  onClose,
  client,
  research,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  client: Client;
  research: ResearchProject[];
  onCreated: (id: string) => void;
}) {
  const usable = research.filter((r) => r.mainAnalysis || r.synthesis);
  const [researchId, setResearchId] = useState(usable[0]?.id ?? "");
  const [count, setCount] = useState(16);
  const job = useJob();
  return (
    <Modal open={open} onClose={onClose} title="Neuer 30-Tage-Plan">
      <div className="space-y-5">
        <Field label="Grundlage">
          {(id) => (
            <Select id={id} value={researchId} onChange={(e) => setResearchId(e.target.value)}>
              <option value="">Ohne Recherche (nur Kundenprofil)</option>
              {usable.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={`Anzahl Videos im Monat: ${count}`}>
          {(id) => <input id={id} type="range" min={6} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} className="accent-terracotta" />}
        </Field>
        {job.error && <ErrorNote>{job.error}</ErrorNote>}
        <div className="flex justify-end gap-3">
          <Btn variant="ghost" onClick={onClose}>
            Abbrechen
          </Btn>
          <Btn
            loading={job.busy}
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() =>
              job.run("Plan", async () => {
                const base = research.find((r) => r.id === researchId);
                const result = await runAi("contentPlan", { client: toBrief(client), anzahl: count, erkenntnisse: researchInsights(base) });
                const now = Date.now();
                const plan: ContentPlan = {
                  id: uid("p_"),
                  clientId: client.id,
                  createdAt: now,
                  updatedAt: now,
                  title: `Content-Plan ${new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`,
                  researchId: base?.id,
                  strategie: result.strategie,
                  saeulen: result.saeulen,
                  ideen: result.ideen
                    .map((idea) => ({ ...idea, tag: Math.max(1, Math.min(30, Math.round(idea.tag))), id: uid("i_"), status: "idee" as const }))
                    .sort((a, b) => a.tag - b.tag),
                };
                await put("plans", plan);
                onCreated(plan.id);
              })
            }
          >
            Plan erstellen
          </Btn>
        </div>
        {job.busy && <p className="text-sm text-cream/55">Die KI plant den Monat … (ca. 1 Minute)</p>}
      </div>
    </Modal>
  );
}

function PlanView({ plan, client, research }: { plan: ContentPlan; client: Client; research: ResearchProject[] }) {
  const router = useRouter();
  const { status } = useStudioStatus();
  const job = useJob();
  const [view, setView] = useState<ContentIdea | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoOpen, setAutoOpen] = useState(false);
  const insights = useMemo(() => researchInsights(research.find((r) => r.id === plan.researchId)), [research, plan.researchId]);
  const start = new Date(plan.createdAt);
  start.setHours(0, 0, 0, 0);

  const patchIdea = (id: string, fn: (idea: ContentIdea) => ContentIdea) =>
    update("plans", plan.id, (p) => ({ ...p, ideen: p.ideen.map((i) => (i.id === id ? fn(i) : i)) }));

  const writeScript = async (idea: ContentIdea) => {
    const script = await runAi("ideaScript", {
      client: toBrief(client),
      idee: { titel: idea.titel, hook: idea.hook, format: idea.format, saeule: idea.saeule, ziel: idea.ziel, plattform: idea.plattform },
      erkenntnisse: insights,
    });
    await patchIdea(idea.id, (i) => ({ ...i, script, status: i.status === "idee" ? "skript" : i.status }));
  };

  const writeAll = () =>
    job.run("Skripte", async (ctx) => {
      const todo = plan.ideen.filter((i) => !i.script);
      let done = 0;
      ctx.note(`Skripte: 0/${todo.length}`);
      const results = await mapLimit(todo, 3, async (idea) => {
        await writeScript(idea);
        done++;
        ctx.progress(done / todo.length);
        ctx.note(`Skripte: ${done}/${todo.length}`);
      });
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) throw new Error(`${failed} Skript(e) fehlgeschlagen – bitte erneut starten (fertige bleiben erhalten).`);
    });

  const makeVideo = async (idea: ContentIdea, mode: "ai" | "upload") => {
    const v = await createVideo(client, { mode, script: idea.script, title: idea.titel });
    await patchIdea(idea.id, (i) => ({ ...i, videoId: v.id, status: "video" }));
    router.push(`/studio/video/${v.id}`);
  };

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const lead = (start.getDay() + 6) % 7; // Montag = 0

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-cream/85">{plan.strategie}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {plan.saeulen.map((s) => (
            <Badge key={s.name} tone="accent" title={s.beschreibung}>
              {s.name} · {Math.round(s.anteil)} %
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <h3 className="mb-3 font-serif text-lg font-semibold">Kalender</h3>
        <div className="grid min-w-[700px] grid-cols-7 gap-1.5 text-xs">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
            <div key={d} className="px-1 pb-1 font-semibold text-cream/45">
              {d}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {days.map((d, i) => {
            const ideas = plan.ideen.filter((idea) => idea.tag === i + 1);
            return (
              <div key={i} className={cx("min-h-[78px] rounded-lg p-1.5", ideas.length ? "bg-ink-700" : "bg-ink-800/60")}>
                <p className="text-[10px] text-cream/40">{d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</p>
                {ideas.map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => document.getElementById(`idea-${idea.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className={cx(
                      "mt-1 block w-full truncate rounded px-1.5 py-0.5 text-left",
                      idea.status === "idee" ? "bg-ink-600 text-cream/70" : idea.status === "skript" ? "bg-terracotta/25" : "bg-emerald-500/20",
                    )}
                    title={idea.titel}
                  >
                    {idea.titel}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cream/55">
          {plan.ideen.filter((i) => i.script).length}/{plan.ideen.length} Skripte · {plan.ideen.filter((i) => i.videoId).length} Videos
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" icon={<FileText className="h-4 w-4" />} onClick={writeAll} disabled={job.busy || !status?.claude || plan.ideen.every((i) => i.script)}>
            Alle Skripte schreiben
          </Btn>
          <Btn
            icon={<Rocket className="h-4 w-4" />}
            onClick={() => setAutoOpen(true)}
            disabled={job.busy || !plan.ideen.some((i) => i.script && selected.has(i.id))}
          >
            Autopilot für Auswahl ({plan.ideen.filter((i) => i.script && selected.has(i.id)).length})
          </Btn>
        </div>
      </div>
      {job.busy && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm text-amber-100">
            <Spinner /> {job.note}
          </p>
          <Progress value={job.progress ?? 0} />
        </div>
      )}
      {job.error && <ErrorNote>{job.error}</ErrorNote>}

      <div className="space-y-3">
        {plan.ideen.map((idea) => (
          <Card key={idea.id} className="p-4 sm:p-5">
            <div id={`idea-${idea.id}`} className="flex flex-wrap items-start gap-4 scroll-mt-24">
              <input
                type="checkbox"
                className="mt-1.5 h-4 w-4 accent-terracotta"
                checked={selected.has(idea.id)}
                disabled={!idea.script}
                title={idea.script ? "Für Autopilot auswählen" : "Erst Skript schreiben"}
                onChange={(e) =>
                  setSelected((s) => {
                    const next = new Set(s);
                    if (e.target.checked) next.add(idea.id);
                    else next.delete(idea.id);
                    return next;
                  })
                }
                aria-label={`${idea.titel} auswählen`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-cream/40">Tag {idea.tag}</span>
                  <Badge tone={STATUS_TONE[idea.status]}>{IDEA_STATUS_LABEL[idea.status]}</Badge>
                  <Badge>{idea.saeule}</Badge>
                  <Badge>{idea.format}</Badge>
                  <Badge>Aufwand {idea.aufwand}</Badge>
                </div>
                <p className="mt-1.5 font-serif text-lg font-semibold">{idea.titel}</p>
                <p className="text-sm text-cream/70">Hook: „{idea.hook}“</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={idea.status}
                  onChange={(e) => void patchIdea(idea.id, (i) => ({ ...i, status: e.target.value as IdeaStatus }))}
                  className="w-auto py-1.5 text-xs"
                  aria-label="Status"
                >
                  {(Object.keys(IDEA_STATUS_LABEL) as IdeaStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {IDEA_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
                {idea.script ? (
                  <>
                    <Btn size="sm" variant="secondary" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setView(idea)}>
                      Skript
                    </Btn>
                    {idea.videoId ? (
                      <Btn size="sm" variant="secondary" onClick={() => router.push(`/studio/video/${idea.videoId}`)}>
                        Video öffnen
                      </Btn>
                    ) : (
                      <>
                        <Btn size="sm" icon={<Wand2 className="h-3.5 w-3.5" />} onClick={() => makeVideo(idea, "ai")}>
                          KI-Video
                        </Btn>
                        <Btn size="sm" variant="secondary" icon={<Scissors className="h-3.5 w-3.5" />} onClick={() => makeVideo(idea, "upload")}>
                          Selbst drehen
                        </Btn>
                      </>
                    )}
                  </>
                ) : (
                  <IdeaScriptButton onWrite={() => writeScript(idea)} disabled={job.busy || !status?.claude} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={Boolean(view)} onClose={() => setView(null)} title={view?.titel ?? ""} wide>
        {view?.script && <ScriptView script={view.script} />}
      </Modal>
      <AutopilotModal
        open={autoOpen}
        onClose={() => setAutoOpen(false)}
        client={client}
        ideas={plan.ideen.filter((i) => i.script && selected.has(i.id))}
        onIdeaVideo={(ideaId, videoId, state) => patchIdea(ideaId, (i) => ({ ...i, videoId, status: state }))}
      />
    </div>
  );
}

function IdeaScriptButton({ onWrite, disabled }: { onWrite: () => Promise<void>; disabled: boolean }) {
  const job = useJob();
  return (
    <span className="flex items-center gap-2">
      <Btn size="sm" icon={<FileText className="h-3.5 w-3.5" />} loading={job.busy} disabled={disabled} onClick={() => job.run("Skript", onWrite)}>
        Skript schreiben
      </Btn>
      {job.error && <span className="text-xs text-red-300">{job.error}</span>}
    </span>
  );
}

type Voice = { id: string; name: string };

function AutopilotModal({
  open,
  onClose,
  client,
  ideas,
  onIdeaVideo,
}: {
  open: boolean;
  onClose: () => void;
  client: Client;
  ideas: ContentIdea[];
  onIdeaVideo: (ideaId: string, videoId: string, status: IdeaStatus) => Promise<unknown>;
}) {
  const { status } = useStudioStatus();
  const job = useJob();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const ready = Boolean(status?.claude && status?.elevenlabs && status?.fal);

  useEffect(() => {
    if (!open || !status?.elevenlabs) return;
    api<{ voices: Voice[]; defaultVoice: string | null }>("/api/studio/voice")
      .then((r) => {
        setVoices(r.voices);
        setVoiceId((v) => v || r.defaultVoice || r.voices[0]?.id || "");
      })
      .catch(() => setVoices([]));
  }, [open, status?.elevenlabs]);

  const start = () =>
    job.run("Autopilot", async (ctx) => {
      setLog([]);
      for (let n = 0; n < ideas.length; n++) {
        const idea = ideas[n];
        const prefix = `${n + 1}/${ideas.length} „${idea.titel}“`;
        const video = idea.videoId ? { id: idea.videoId } : await createVideo(client, { mode: "ai", script: idea.script, title: idea.titel });
        await onIdeaVideo(idea.id, video.id, "video");
        try {
          const result = await autopilot(video.id, client, voiceId, {
            note: (t) => ctx.note(`${prefix}: ${t}`),
            signal: ctx.signal,
            rate: true,
          });
          await onIdeaVideo(idea.id, video.id, "fertig");
          setLog((l) => [...l, `✓ ${idea.titel}${result.failedScenes ? ` (${result.failedScenes} Szene(n) ohne Clip)` : ""}`]);
        } catch (error) {
          if (ctx.signal.aborted) throw error;
          setLog((l) => [...l, `✗ ${idea.titel}: ${error instanceof Error ? error.message : "Fehler"}`]);
        }
        ctx.progress((n + 1) / ideas.length);
      }
    });

  return (
    <Modal open={open} onClose={() => !job.busy && onClose()} title="Autopilot: fertige KI-Videos am Stück">
      <div className="space-y-4">
        <p className="text-sm text-cream/65">
          Für jede ausgewählte Idee: Voiceover einsprechen, alle Szenen als KI-Clips generieren, schneiden, Untertitel und Hook setzen,
          rendern und Viral-Check. {ideas.length} Video(s) · dauert je ca. 3–8 Minuten.
        </p>
        {!ready && <InfoNote>Benötigt ANTHROPIC_API_KEY, ELEVENLABS_API_KEY und FAL_KEY.</InfoNote>}
        <Field label="Stimme">
          {(id) => (
            <Select id={id} value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={!voices.length}>
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {job.busy && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-amber-100">
              <Spinner /> {job.note}
            </p>
            <Progress value={job.progress ?? 0} />
            <p className="text-xs text-cream/40">Tab offen lassen – Videos werden auf diesem Rechner gerendert.</p>
          </div>
        )}
        {log.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-ink-700 p-3 text-sm">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
        {job.error && <ErrorNote>{job.error}</ErrorNote>}
        <div className="flex justify-end gap-3">
          {job.busy ? (
            <Btn variant="secondary" onClick={job.cancel}>
              Abbrechen
            </Btn>
          ) : (
            <Btn variant="ghost" onClick={onClose}>
              Schließen
            </Btn>
          )}
          <Btn icon={<Rocket className="h-4 w-4" />} onClick={start} disabled={!ready || !voiceId || job.busy || !ideas.length}>
            Starten
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
