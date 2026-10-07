import { put, uid } from "./db";
import {
  RESEARCH_STEPS,
  type Client,
  type ResearchProject,
  type ResearchSettings,
  type ResearchStepId,
  type Script,
  type StepState,
  type VideoProject,
} from "./types";

export const STEP_LABEL: Record<ResearchStepId, string> = {
  plan: "Suchstrategie",
  discover: "Konkurrenz auf TikTok & Instagram suchen",
  select: "Echte Konkurrenten auswählen",
  main: "Hauptkonkurrent analysieren",
  draft: "Skript-Entwurf",
  competitors: "Weitere Konkurrenten analysieren",
  trends: "Trends analysieren",
  final: "Fertiges Skript",
};

export async function createResearch(client: Client, settings: ResearchSettings) {
  const now = Date.now();
  const steps = Object.fromEntries(RESEARCH_STEPS.map((s) => [s, { status: "idle" } satisfies StepState])) as Record<
    ResearchStepId,
    StepState
  >;
  const project: ResearchProject = {
    id: uid("r_"),
    clientId: client.id,
    createdAt: now,
    updatedAt: now,
    title: settings.thema ? `${client.branche}: ${settings.thema}` : `Konkurrenz-Analyse ${client.branche}`,
    settings,
    steps,
  };
  return put("research", project);
}

export async function createVideo(
  client: Client,
  opts: { mode: VideoProject["mode"]; title?: string; script?: Script; researchId?: string },
) {
  const now = Date.now();
  const project: VideoProject = {
    id: uid("v_"),
    clientId: client.id,
    createdAt: now,
    updatedAt: now,
    title: opts.title || opts.script?.titel || (opts.mode === "ai" ? "KI-Video" : "Eigenes Video"),
    mode: opts.mode,
    researchId: opts.researchId,
    script: opts.script,
    sources: [],
    renders: [],
    captionStyle: client.brand.captionStyle,
    status: "entwurf",
  };
  return put("videos", project);
}

/** Kompakte Text-Zusammenfassung einer Recherche als Kontext für Folge-Aufgaben. */
export function researchInsights(project: ResearchProject | undefined | null): string {
  if (!project) return "";
  const parts: string[] = [];
  if (project.mainAnalysis) {
    parts.push(
      `Hauptkonkurrent: ${project.mainAnalysis.kurzfazit}\nWarum viele Aufrufe: ${project.mainAnalysis.warumVieleAufrufe
        .map((e) => e.punkt)
        .join("; ")}\nChancen: ${project.mainAnalysis.chancenFuerUns.join("; ")}`,
    );
  }
  if (project.synthesis) {
    parts.push(
      `Erfolgsmuster: ${project.synthesis.erfolgsmuster.map((m) => m.muster).join("; ")}\nHäufige Fehler: ${project.synthesis.haeufigeFehler
        .map((f) => f.fehler)
        .join("; ")}\nContent-Lücken: ${project.synthesis.contentLuecken.map((l) => `${l.luecke} → ${l.idee}`).join("; ")}\nBenchmarks: ${JSON.stringify(
        project.synthesis.benchmarks,
      )}`,
    );
  }
  if (project.trends) {
    parts.push(
      `Trends: ${project.trends.trends
        .filter((t) => t.passung >= 6)
        .map((t) => `${t.name} (${t.typ}): ${t.umsetzung}`)
        .join("; ")}`,
    );
  }
  if (project.final) {
    parts.push(`Bereits produziertes Skript: "${project.final.titel}" – Hook: ${project.final.hooks[0]?.text ?? ""}`);
  }
  return parts.join("\n\n").slice(0, 18000);
}
