"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, MoneyInput, Select, Textarea } from "@/components/ui/inputs";
import { BILLING_INTERVALS, CONTRACT_STATUS, NOTICE_UNITS } from "@/lib/constants";
import { centsToInput } from "@/lib/format";
import type { ActionState } from "@/lib/actions/types";
import type { Contract } from "@/lib/db/schema";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function ContractForm({
  action,
  contract,
  serviceNames,
  today,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  contract?: Contract;
  serviceNames: string[];
  today: string;
}) {
  const c = contract;
  const allServices = Array.from(new Set([...serviceNames, ...(c?.services ?? [])]));
  return (
    <ActionForm action={action} className="space-y-5">
      <Group title="Vertrag">
        <Field label="Bezeichnung / Paket" name="title" required className="sm:col-span-2">
          <Input name="title" defaultValue={c?.title} placeholder="z. B. Social Media Paket M" required />
        </Field>
        <Field label="Status" name="status">
          <Select name="status" defaultValue={c?.status ?? "aktiv"} options={CONTRACT_STATUS} />
        </Field>
        <Field label="Unterschrieben am" name="signedAt">
          <Input type="date" name="signedAt" defaultValue={c?.signedAt ?? ""} />
        </Field>
        <Field label="Beginn" name="startDate" required>
          <Input type="date" name="startDate" defaultValue={c?.startDate ?? today} required />
        </Field>
        <Field label="Ende (falls fest)" name="endDate" hint="Leer lassen bei Mindestlaufzeit/unbefristet">
          <Input type="date" name="endDate" defaultValue={c?.endDate ?? ""} />
        </Field>
        <Field label="Mindestlaufzeit (Monate)" name="minTermMonths">
          <Input type="number" min={0} name="minTermMonths" defaultValue={c?.minTermMonths ?? 6} />
        </Field>
        <Field label="Verlängert sich um (Monate)" name="autoRenewMonths" hint="0 = keine automatische Verlängerung">
          <Input type="number" min={0} name="autoRenewMonths" defaultValue={c?.autoRenewMonths ?? 3} />
        </Field>
        <Field label="Kündigungsfrist" name="noticePeriod" className="sm:col-span-2">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <Input type="number" min={0} name="noticePeriod" defaultValue={c?.noticePeriod ?? 1} />
            <Select name="noticeUnit" defaultValue={c?.noticeUnit ?? "monate"} options={NOTICE_UNITS} />
          </div>
        </Field>
      </Group>

      <Group title="Leistungsumfang pro Monat">
        <Field label="Videos / Reels" name="videosPerMonth" hint="Zählt auf das Content-Soll">
          <Input type="number" min={0} name="videosPerMonth" defaultValue={c?.videosPerMonth ?? 0} />
        </Field>
        <Field label="Bild-Posts / Karussells / Stories" name="postsPerMonth">
          <Input type="number" min={0} name="postsPerMonth" defaultValue={c?.postsPerMonth ?? 0} />
        </Field>
        <Field label="Vor-Ort-Termine / Drehtage" name="visitsPerMonth" hint="Wie oft müsst ihr vorbeikommen?">
          <Input type="number" min={0} name="visitsPerMonth" defaultValue={c?.visitsPerMonth ?? 0} />
        </Field>
        <Field label="Werbebudget des Kunden / Monat" name="adBudgetMonthly" hint="Ad-Spend, nicht euer Honorar">
          <MoneyInput name="adBudgetMonthly" defaultValue={centsToInput(c?.adBudgetMonthly ?? 0)} />
        </Field>
        {allServices.length > 0 && (
          <div className="sm:col-span-2">
            <p className="label">Enthaltene Leistungen</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {allServices.map((s) => (
                <Checkbox key={s} name="services" value={s} label={s} defaultChecked={c?.services.includes(s)} />
              ))}
            </div>
          </div>
        )}
      </Group>

      <Group title="Konditionen & Abrechnung">
        <Field label="Monatliche Vergütung (netto)" name="monthlyFee">
          <MoneyInput name="monthlyFee" defaultValue={centsToInput(c?.monthlyFee ?? 0)} />
        </Field>
        <Field label="Einrichtungsgebühr (netto, einmalig)" name="setupFee">
          <MoneyInput name="setupFee" defaultValue={centsToInput(c?.setupFee ?? 0)} />
        </Field>
        <Field label="Abrechnung" name="billingInterval">
          <Select name="billingInterval" defaultValue={c?.billingInterval ?? "monatlich"} options={BILLING_INTERVALS} />
        </Field>
        <Field label="Nächste Rechnung am" name="nextInvoiceDate">
          <Input type="date" name="nextInvoiceDate" defaultValue={c?.nextInvoiceDate ?? ""} />
        </Field>
        <Checkbox
          className="sm:col-span-2"
          name="autoInvoice"
          defaultChecked={c?.autoInvoice}
          label="Serienrechnung automatisch vorbereiten"
          description="Zum Termin wird ein Rechnungsentwurf erstellt, den ihr nur noch prüfen und versenden müsst."
        />
        <Field label="Besondere Bedingungen" name="conditions" className="sm:col-span-2" hint="z. B. Drehs nur vormittags, Freigabe durch Inhaber, Exklusivität, Nutzungsrechte …">
          <Textarea name="conditions" rows={3} defaultValue={c?.conditions ?? ""} />
        </Field>
        <Field label="Interne Notizen" name="notes" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={c?.notes ?? ""} />
        </Field>
        <Field label="Unterschriebener Vertrag (PDF)" name="file" className="sm:col-span-2" hint={c?.fileId ? "Bereits hinterlegt – neue Datei ersetzt die Verknüpfung" : "Wird automatisch in der Ablage gespeichert"}>
          <Input type="file" name="file" accept="application/pdf,image/*" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-2 file:py-1 file:text-xs" />
        </Field>
      </Group>

      <FormActions>
        <CancelButton />
        <SubmitButton>Speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}

export function CancelContractForm({
  action,
  suggestedEnd,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  suggestedEnd: string;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Vertrag endet am" name="endDate" hint="Vorgeschlagen: Ende der aktuellen Laufzeit">
        <Input type="date" name="endDate" defaultValue={suggestedEnd} required />
      </Field>
      <Field label="Grund (optional)" name="reason">
        <Textarea name="reason" rows={2} />
      </Field>
      <FormActions>
        <CancelButton />
        <SubmitButton variant="danger">Kündigung erfassen</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
