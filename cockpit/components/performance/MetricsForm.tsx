"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input } from "@/components/ui/inputs";
import { PlatformIcon } from "@/components/PlatformIcon";
import { ACCOUNT_METRICS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";

const GROUPS = [
  { platform: "instagram", title: "Instagram" },
  { platform: "tiktok", title: "TikTok" },
  { platform: "facebook", title: "Facebook" },
  { platform: "youtube", title: "YouTube" },
  { platform: "google", title: "Google-Unternehmensprofil" },
  { platform: "website", title: "Website" },
];

export function MetricsForm({ action, today }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; today: string }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Stand vom" name="date" required hint="Bestandswerte (Follower, Sterne) zum Stichtag – Zeitraumwerte (Klicks, Reichweite) für diesen Tag bzw. als Monatssumme am Monatsletzten">
        <Input type="date" name="date" defaultValue={today} required className="max-w-48" />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((g) => (
          <fieldset key={g.platform} className="rounded-xl border border-line p-4">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold">
              <PlatformIcon platform={g.platform} className="size-3.5" /> {g.title}
            </legend>
            <div className="space-y-3">
              {ACCOUNT_METRICS.filter((m) => m.platform === g.platform).map((m) => (
                <Field key={m.metric} label={m.label.replace(/^(Instagram|TikTok|Facebook|YouTube)-/, "")} name={`${m.platform}:${m.metric}`}>
                  <Input name={`${m.platform}:${m.metric}`} inputMode="decimal" placeholder="–" />
                </Field>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>Werte speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
