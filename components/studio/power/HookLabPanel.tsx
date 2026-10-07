"use client";

import { Zap } from "lucide-react";
import { useState } from "react";
import { runAi } from "@/lib/studio/api";
import { researchInsights } from "@/lib/studio/projects";
import type { HookLab } from "@/lib/studio/schemas";
import { toBrief } from "@/lib/studio/tasks";
import type { Client, ResearchProject } from "@/lib/studio/types";
import { useStudioStatus } from "../StudioShell";
import { useJob } from "../video/useJob";
import { Badge, Btn, Card, CopyButton, ErrorNote, Field, ScoreRing, SectionTitle, Select, TextArea, TextInput } from "../ui";

export function HookLabPanel({ client, research }: { client: Client; research: ResearchProject[] }) {
  const { status } = useStudioStatus();
  const job = useJob();
  const scripts = research.flatMap((r) => [r.final, r.draft].filter((s): s is NonNullable<typeof s> => Boolean(s)));
  const [thema, setThema] = useState("");
  const [oldHook, setOldHook] = useState("");
  const [result, setResult] = useState<HookLab | null>(null);
  const basis = research.find((r) => r.synthesis || r.mainAnalysis);

  return (
    <section className="space-y-6">
      <SectionTitle title="Hook-Lab">
        Die ersten zwei Sekunden entscheiden. Zehn Hook-Varianten pro Thema, bewertet und sortiert. Gefüttert mit den Mustern deiner
        Konkurrenz-Recherche.
      </SectionTitle>
      <Card className="space-y-4">
        {scripts.length > 0 && (
          <Field label="Aus vorhandenem Skript übernehmen (optional)">
            {(id) => (
              <Select
                id={id}
                defaultValue=""
                onChange={(e) => {
                  const s = scripts[Number(e.target.value)];
                  if (!s) return;
                  setThema(`${s.titel}: ${s.kernidee}`);
                  setOldHook(s.hooks[0]?.text ?? "");
                }}
              >
                <option value="">– Skript wählen –</option>
                {scripts.map((s, i) => (
                  <option key={i} value={i}>
                    {s.titel}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Worum geht es im Video?">
          {(id) => <TextArea id={id} rows={2} value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z. B. Warum Billig-Dachfenster nach 5 Jahren undicht werden" />}
        </Field>
        <Field label="Bisheriger Hook (optional)">
          {(id) => <TextInput id={id} value={oldHook} onChange={(e) => setOldHook(e.target.value)} />}
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Btn
            icon={<Zap className="h-4 w-4" />}
            loading={job.busy}
            disabled={!thema.trim() || !status?.claude}
            onClick={() =>
              job.run("Hooks", async () => {
                setResult(
                  await runAi("hookLab", {
                    client: toBrief(client),
                    thema: thema.trim(),
                    bisherigerHook: oldHook.trim(),
                    erkenntnisse: researchInsights(basis),
                  }),
                );
              })
            }
          >
            10 Hooks generieren
          </Btn>
          {basis && <span className="text-xs text-cream/45">mit Erkenntnissen aus „{basis.title}“</span>}
        </div>
        {job.error && <ErrorNote>{job.error}</ErrorNote>}
      </Card>
      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...result.hooks]
            .sort((a, b) => b.score - a.score)
            .map((h, i) => (
              <Card key={i} className="flex gap-4">
                <ScoreRing score={h.score} size={64} />
                <div className="min-w-0 flex-1">
                  <Badge>{h.typ}</Badge>
                  <p className="mt-2 font-serif text-lg leading-snug">„{h.text}“</p>
                  <p className="mt-1 text-xs text-cream/55">
                    <span className="font-semibold text-cream/70">Bild:</span> {h.visuell}
                  </p>
                  <p className="mt-1 text-xs text-cream/50">{h.warum}</p>
                  <div className="mt-3">
                    <CopyButton text={h.text} />
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </section>
  );
}
