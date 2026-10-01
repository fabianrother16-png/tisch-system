"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, MoneyInput, Select } from "@/components/ui/inputs";
import { AD_PLATFORMS } from "@/lib/constants";
import { centsToInput } from "@/lib/format";
import type { ActionState } from "@/lib/actions/types";
import type { AdCampaign } from "@/lib/db/schema";

export function CampaignForm({ action, campaign, today }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; campaign?: AdCampaign; today: string }) {
  const c = campaign;
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kampagnenname" name="name" required className="sm:col-span-2">
          <Input name="name" defaultValue={c?.name} required autoFocus={!c} />
        </Field>
        <Field label="Plattform" name="platform">
          <Select name="platform" defaultValue={c?.platform ?? "meta"} options={AD_PLATFORMS} />
        </Field>
        <Field label="Status" name="status">
          <Select name="status" defaultValue={c?.status ?? "aktiv"} options={[{ value: "aktiv", label: "Aktiv" }, { value: "pausiert", label: "Pausiert" }, { value: "beendet", label: "Beendet" }]} />
        </Field>
        <Field label="Ziel" name="objective">
          <Input name="objective" defaultValue={c?.objective ?? ""} placeholder="Leads, Reichweite, Besuche …" />
        </Field>
        <Field label="Tagesbudget" name="dailyBudget">
          <MoneyInput name="dailyBudget" defaultValue={centsToInput(c?.dailyBudget ?? null)} />
        </Field>
        <Field label="Start" name="startDate">
          <Input type="date" name="startDate" defaultValue={c?.startDate ?? ""} />
        </Field>
        <Field label="Ende" name="endDate">
          <Input type="date" name="endDate" defaultValue={c?.endDate ?? ""} />
        </Field>
      </div>
      {!c && <AdStatsFields today={today} title="Erste Zahlen (optional)" />}
      <FormActions>
        <CancelButton />
        <SubmitButton>Speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}

function AdStatsFields({ today, title }: { today: string; title: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <p className="mb-3 text-xs font-semibold text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Datum" name="statDate">
          <Input type="date" name="statDate" defaultValue={today} />
        </Field>
        <Field label="Ausgaben" name="spend">
          <MoneyInput name="spend" />
        </Field>
        <Field label="Impressionen" name="impressions">
          <Input type="number" min={0} name="impressions" />
        </Field>
        <Field label="Reichweite" name="reach">
          <Input type="number" min={0} name="reach" />
        </Field>
        <Field label="Klicks" name="clicks">
          <Input type="number" min={0} name="clicks" />
        </Field>
        <Field label="Leads / Conversions" name="conversions">
          <Input name="conversions" inputMode="decimal" />
        </Field>
      </div>
      <p className="mt-2 text-xs text-muted">Tipp: Für Monatswerte einfach den Monatsletzten als Datum nehmen.</p>
    </div>
  );
}

export function AdStatsForm({ action, today }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; today: string }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <AdStatsFields today={today} title="Zahlen für einen Tag oder Zeitraum" />
      <FormActions>
        <CancelButton />
        <SubmitButton>Speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
