"use client";

import { Scissors, Trash2 } from "lucide-react";
import { update } from "@/lib/studio/db";
import { fmtSec } from "@/lib/studio/format";
import type { Client, VideoProject } from "@/lib/studio/types";
import { planEdit, settingsOf, transcribeMissing } from "@/lib/studio/video/workflow";
import { useStudioStatus } from "../StudioShell";
import { Badge, Btn, Card, ErrorNote, Field, List, Select, Spinner, TextArea, TextInput } from "../ui";
import { useJob } from "./useJob";

const ZWECK_LABEL: Record<string, string> = { hook: "Hook", inhalt: "Inhalt", beweis: "Beweis", cta: "CTA", broll: "B-Roll" };

export function EditPanel({ project, client }: { project: VideoProject; client: Client }) {
  const job = useJob();
  const { status } = useStudioStatus();
  const settings = settingsOf(project);
  const plan = project.editPlan;
  const hasSources = project.sources.some((s) => s.sceneIndex == null);
  const setSettings = (patch: Partial<typeof settings>) =>
    update("videos", project.id, (p) => ({ ...p, settings: { ...settingsOf(p), ...patch } }));
  const setPlan = (fn: (plan: NonNullable<VideoProject["editPlan"]>) => NonNullable<VideoProject["editPlan"]>) =>
    update("videos", project.id, (p) => (p.editPlan ? { ...p, editPlan: fn(p.editPlan) } : p));
  const total = plan ? plan.segmente.reduce((n, s) => n + Math.max(0, s.ende - s.start), 0) : 0;

  const cut = () =>
    job.run("KI-Schnitt", async (ctx) => {
      if (status?.elevenlabs && project.sources.some((s) => s.transcript === undefined)) {
        ctx.note("Erst das Gesprochene erkennen …");
        await transcribeMissing(project.id, ctx.note);
      }
      await planEdit(project.id, client, ctx.note);
    });

  return (
    <Card>
      <h3 className="font-serif text-lg font-semibold">2 · KI-Schnitt</h3>
      <p className="text-sm text-cream/55">
        Die KI hört und sieht das Material, zieht den stärksten Moment als Hook nach vorn, wirft Pausen und Versprecher raus und setzt
        Zooms und Texte.
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
        <Field label={`Ziellänge: ${settings.zielLaenge} s`}>
          {(id) => (
            <input
              id={id}
              type="range"
              min={10}
              max={90}
              step={5}
              value={settings.zielLaenge}
              onChange={(e) => void setSettings({ zielLaenge: Number(e.target.value) })}
              className="accent-terracotta"
            />
          )}
        </Field>
        <Field label="Wunsch an den Schnitt (optional)">
          {(id) => (
            <TextArea
              id={id}
              rows={2}
              defaultValue={settings.wunsch}
              key={settings.wunsch}
              onBlur={(e) => e.target.value !== settings.wunsch && void setSettings({ wunsch: e.target.value })}
              placeholder="z. B. mit dem Vorher-Bild anfangen, schnelleres Tempo, Preis am Ende nennen"
            />
          )}
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Btn icon={<Scissors className="h-4 w-4" />} onClick={cut} loading={job.busy} disabled={!hasSources || !status?.claude}>
          {plan ? "Neu schneiden lassen" : "KI schneiden lassen"}
        </Btn>
        {job.busy && (
          <span className="flex items-center gap-2 text-sm text-amber-100">
            <Spinner /> {job.note ?? job.label}
          </span>
        )}
        {!hasSources && <span className="text-sm text-cream/45">Erst Clips hochladen.</span>}
      </div>
      {job.error && (
        <div className="mt-4">
          <ErrorNote>{job.error}</ErrorNote>
        </div>
      )}

      {plan && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl bg-ink-700 p-4">
            <p className="text-sm text-cream/80">{plan.konzept}</p>
            <p className="mt-2 text-xs text-cream/45">
              {plan.segmente.length} Schnitte · {fmtSec(total)} · Ziel {settings.zielLaenge} s
            </p>
          </div>
          <Field label="Hook-Text (erste Sekunden)">
            {(id) => (
              <TextInput
                id={id}
                defaultValue={plan.hookText}
                key={plan.hookText}
                onBlur={(e) => e.target.value !== plan.hookText && void setPlan((p) => ({ ...p, hookText: e.target.value }))}
              />
            )}
          </Field>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-cream/45">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Clip</th>
                  <th className="py-2 pr-3">Bereich</th>
                  <th className="py-2 pr-3">Zweck</th>
                  <th className="py-2 pr-3">Zoom</th>
                  <th className="py-2 pr-3">Text-Einblendung</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/[0.06]">
                {plan.segmente.map((seg, i) => (
                  <tr key={`${i}-${seg.quelle}-${seg.start}`}>
                    <td className="py-2 pr-3 text-cream/45">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <Badge tone="accent">{seg.quelle}</Badge>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs">
                      {seg.start.toFixed(1)}–{seg.ende.toFixed(1)} s <span className="text-cream/40">({(seg.ende - seg.start).toFixed(1)} s)</span>
                    </td>
                    <td className="py-2 pr-3 text-cream/70">{ZWECK_LABEL[seg.zweck] ?? seg.zweck}</td>
                    <td className="py-2 pr-3">
                      <Select
                        value={seg.zoom}
                        className="py-1 text-xs"
                        aria-label="Zoom"
                        onChange={(e) =>
                          void setPlan((p) => ({
                            ...p,
                            segmente: p.segmente.map((s, j) => (j === i ? { ...s, zoom: e.target.value as typeof s.zoom } : s)),
                          }))
                        }
                      >
                        <option value="kein">kein</option>
                        <option value="leicht">leicht</option>
                        <option value="punch">Punch-In</option>
                      </Select>
                    </td>
                    <td className="py-2 pr-3">
                      <TextInput
                        className="py-1 text-xs"
                        defaultValue={seg.textEinblendung}
                        key={seg.textEinblendung}
                        aria-label="Text-Einblendung"
                        onBlur={(e) =>
                          e.target.value !== seg.textEinblendung &&
                          void setPlan((p) => ({
                            ...p,
                            segmente: p.segmente.map((s, j) => (j === i ? { ...s, textEinblendung: e.target.value } : s)),
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <button
                        className="rounded-lg p-1.5 text-cream/40 hover:bg-ink-600 hover:text-red-300"
                        aria-label="Schnitt entfernen"
                        onClick={() => void setPlan((p) => ({ ...p, segmente: p.segmente.filter((_, j) => j !== i) }))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plan.begruendung.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm text-cream/60">Warum so geschnitten?</summary>
              <div className="mt-3">
                <List items={plan.begruendung} />
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}
