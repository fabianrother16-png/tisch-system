"use client";

import { ActionForm, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input } from "@/components/ui/inputs";
import { PlatformIcon } from "@/components/PlatformIcon";
import { ACCOUNT_METRICS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";

type Baseline = { platform: string; metric: string; value: number; date: string | null };

export function BaselineForm({
  action,
  baselines,
  startDate,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  baselines: Baseline[];
  startDate: string | null;
}) {
  const val = (p: string, m: string) => {
    const b = baselines.find((x) => x.platform === p && x.metric === m);
    return b ? String(b.value).replace(".", ",") : "";
  };
  const relevant = ACCOUNT_METRICS.filter((m) => !["likes_total", "reach", "profile_views", "visitors"].includes(m.metric));
  return (
    <ActionForm action={action} keepOpen className="space-y-4">
      <Field label="Stand vom" name="date" hint="Meist der Tag vor Beginn der Zusammenarbeit">
        <Input type="date" name="date" defaultValue={baselines[0]?.date ?? startDate ?? ""} className="max-w-48" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {relevant.map((m) => (
          <Field
            key={`${m.platform}:${m.metric}`}
            name={`b:${m.platform}:${m.metric}`}
            label={
              <span className="inline-flex items-center gap-1.5">
                <PlatformIcon platform={m.platform} className="size-3.5" />
                {m.label}
                {m.kind === "zeitraum" && <span className="text-muted">(pro Monat)</span>}
              </span>
            }
          >
            <Input name={`b:${m.platform}:${m.metric}`} defaultValue={val(m.platform, m.metric)} inputMode="decimal" placeholder="–" />
          </Field>
        ))}
      </div>
      <FormActions>
        <SubmitButton>Ausgangswerte speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
