"use client";

import { AlertTriangle, ArrowLeft, Check, Circle, Download, Pause, Play, RotateCcw, Scissors, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRecord } from "@/lib/studio/db";
import { fmtSec, slugify } from "@/lib/studio/format";
import { downloadText, researchToMarkdown } from "@/lib/studio/markdown";
import { cancelPipeline, isPipelineRunning, recoverInterrupted, runPipeline } from "@/lib/studio/pipeline";
import { createVideo, STEP_LABEL } from "@/lib/studio/projects";
import { RESEARCH_STEPS, type Client, type ResearchProject, type ResearchStepId } from "@/lib/studio/types";
import { ScriptView } from "../ScriptView";
import { useStudioStatus } from "../StudioShell";
import { Btn, Card, Empty, ErrorNote, InfoNote, cx } from "../ui";
import { CandidatesSection, CompetitorsSection, DiscoverSection, MainSection, PlanSection, TrendsSection } from "./sections";

export function ResearchView({ id }: { id: string }) {
  const project = useRecord("research", id);
  const client = useRecord("clients", project?.clientId);

  if (project === undefined) return null;
  if (project === null) return <Empty title="Recherche nicht gefunden" />;
  if (!client) return null;
  return <Research project={project} client={client} />;
}

function Research({ project, client }: { project: ResearchProject; client: Client }) {
  const router = useRouter();
  const { status } = useStudioStatus();
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(false);
  const anyRunning = RESEARCH_STEPS.some((s) => project.steps[s].status === "running");
  const allDone = RESEARCH_STEPS.every((s) => project.steps[s].status === "done");
  const failedStep = RESEARCH_STEPS.find((s) => project.steps[s].status === "error");
  const live = isPipelineRunning(project.id);

  // Nach Neuladen hängende Schritte als unterbrochen markieren; mit ?start=1
  // (frisch angelegt) automatisch loslegen.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void recoverInterrupted(project.id).then(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("start") === "1") {
        router.replace(`/studio/recherche/${project.id}`);
        void runPipeline(project.id, client);
      }
    });
  }, [project.id, client, router]);

  useEffect(() => {
    if (!anyRunning) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [anyRunning]);

  const startFrom = (step?: ResearchStepId) => void runPipeline(project.id, client, step);
  const missingKeys = status && (!status.claude || !status.apify);

  return (
    <div className="mx-auto max-w-7xl">
      <Link href={`/studio/kunde/${client.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-cream/55 hover:text-cream">
        <ArrowLeft className="h-4 w-4" /> {client.name}
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta-light">Recherche</p>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{project.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {anyRunning && live ? (
            <Btn variant="secondary" icon={<Pause className="h-4 w-4" />} onClick={() => cancelPipeline(project.id)}>
              Anhalten
            </Btn>
          ) : !allDone ? (
            <Btn icon={<Play className="h-4 w-4" />} onClick={() => startFrom(failedStep)} disabled={Boolean(missingKeys)}>
              {RESEARCH_STEPS.some((s) => project.steps[s].status !== "idle") ? "Fortsetzen" : "Starten"}
            </Btn>
          ) : null}
          <Btn
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={() => downloadText(`${slugify(project.title)}.md`, researchToMarkdown(project, client.name))}
          >
            Report
          </Btn>
        </div>
      </div>

      {missingKeys && (
        <div className="mb-6">
          <InfoNote>
            Für die Recherche werden <strong>ANTHROPIC_API_KEY</strong> und <strong>APIFY_API_TOKEN</strong> benötigt.{" "}
            <Link href="/studio/einstellungen" className="underline">
              Zur Einrichtung
            </Link>
          </InfoNote>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-3 sm:p-3">
            <ol className="space-y-1">
              {RESEARCH_STEPS.map((step, i) => {
                const st = project.steps[step];
                const elapsed =
                  st.startedAt && (st.status === "running" ? now - st.startedAt : st.finishedAt ? st.finishedAt - st.startedAt : 0);
                return (
                  <li key={step}>
                    <a href={`#step-${step}`} className={cx("flex gap-3 rounded-xl px-3 py-2.5", st.status === "running" && "bg-ink-700")}>
                      <StepIcon status={st.status} index={i} />
                      <span className="min-w-0 flex-1">
                        <span className={cx("block text-sm font-medium", st.status === "idle" ? "text-cream/45" : "text-cream")}>
                          {STEP_LABEL[step]}
                        </span>
                        {st.status === "running" && st.note && <span className="block text-xs text-amber-200/80">{st.note}</span>}
                        {st.status === "error" && <span className="block text-xs text-red-300">{st.error}</span>}
                        {st.status === "done" && st.note && <span className="block text-xs text-cream/45">{st.note}</span>}
                        {elapsed ? <span className="block text-[11px] text-cream/35">{fmtSec(elapsed / 1000)}</span> : null}
                      </span>
                    </a>
                    {st.status === "error" && !live && (
                      <div className="px-3 pb-2 pl-12">
                        <Btn size="sm" variant="secondary" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => startFrom(step)}>
                          Erneut versuchen
                        </Btn>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
          {anyRunning && (
            <p className="mt-3 px-2 text-xs text-cream/40">
              Die Recherche läuft in diesem Tab. Du kannst die Seite offen lassen und nebenbei weiterarbeiten. Ergebnisse werden nach jedem
              Schritt gespeichert.
            </p>
          )}
        </aside>

        <div className="min-w-0 space-y-10">
          {failedStep && project.steps[failedStep].error && (
            <ErrorNote>
              <strong>{STEP_LABEL[failedStep]}:</strong> {project.steps[failedStep].error}
            </ErrorNote>
          )}

          {project.final && (
            <section id="step-final" className="scroll-mt-6">
              <ScriptView
                script={project.final}
                label="Fertiges Skript"
                actions={<VideoActions client={client} project={project} />}
              />
            </section>
          )}

          {project.plan && (
            <section id="step-plan" className="scroll-mt-6">
              <PlanSection plan={project.plan} />
            </section>
          )}
          {project.discovered && (
            <section id="step-discover" className="scroll-mt-6">
              <DiscoverSection project={project} />
            </section>
          )}
          {project.candidates && project.selection && (
            <section id="step-select" className="scroll-mt-6">
              <CandidatesSection project={project} />
            </section>
          )}
          {project.mainAnalysis && (
            <section id="step-main" className="scroll-mt-6">
              <MainSection project={project} />
            </section>
          )}
          {project.draft && (
            <section id="step-draft" className="scroll-mt-6">
              <details className="group" open={!project.final}>
                <summary className="mb-4 cursor-pointer list-none font-serif text-xl font-semibold">
                  <span className="text-terracotta-light">Entwurf</span> · {project.draft.titel}
                  <span className="ml-2 text-sm font-normal text-cream/45 group-open:hidden">(aufklappen)</span>
                </summary>
                <ScriptView script={project.draft} label="Entwurf (nach Analyse des Hauptkonkurrenten)" />
              </details>
            </section>
          )}
          {(project.competitorAnalyses || project.synthesis) && (
            <section id="step-competitors" className="scroll-mt-6">
              <CompetitorsSection project={project} />
            </section>
          )}
          {project.trends && (
            <section id="step-trends" className="scroll-mt-6">
              <TrendsSection project={project} />
            </section>
          )}

          {!project.plan && !anyRunning && (
            <Empty title="Bereit" action={<Btn onClick={() => startFrom()}>Recherche starten</Btn>}>
              Die Recherche dauert je nach Plattform-Auslastung etwa 5 bis 15 Minuten.
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIcon({ status, index }: { status: string; index: number }) {
  if (status === "done")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "running")
    return (
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <span className="absolute h-6 w-6 animate-ping rounded-full bg-terracotta/40" />
        <Circle className="h-4 w-4 fill-terracotta text-terracotta" />
      </span>
    );
  if (status === "error")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300">
        <AlertTriangle className="h-3.5 w-3.5" />
      </span>
    );
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-600 text-[11px] font-semibold text-cream/45">
      {index + 1}
    </span>
  );
}

function VideoActions({ client, project }: { client: Client; project: ResearchProject }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"ai" | "upload" | null>(null);
  const make = async (mode: "ai" | "upload") => {
    setBusy(mode);
    const v = await createVideo(client, { mode, script: project.final, researchId: project.id });
    router.push(`/studio/video/${v.id}`);
  };
  return (
    <>
      <Btn size="sm" icon={<Wand2 className="h-3.5 w-3.5" />} loading={busy === "ai"} onClick={() => make("ai")}>
        KI-Video erstellen
      </Btn>
      <Btn size="sm" variant="secondary" icon={<Scissors className="h-3.5 w-3.5" />} loading={busy === "upload"} onClick={() => make("upload")}>
        Mit eigenen Clips drehen
      </Btn>
    </>
  );
}
