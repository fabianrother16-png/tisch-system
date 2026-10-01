"use client";

import { useState } from "react";
import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/inputs";
import { PlatformIcon } from "@/components/PlatformIcon";
import { CONTENT_FORMATS, CONTENT_STATUS, PLATFORMS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { Content } from "@/lib/db/schema";

export type Option = { id: number; name: string };

export function ContentForm({
  action,
  content,
  customers,
  users,
  defaults,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  content?: Content;
  customers: Option[];
  users: Option[];
  defaults?: { customerId?: number; periodMonth: string; status?: string };
}) {
  const c = content;
  const [shootDate, setShootDate] = useState(c?.shootDate ?? "");
  const [status, setStatus] = useState(c?.status ?? defaults?.status ?? "idee");
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kunde" name="customerId" required>
          <Select
            name="customerId"
            defaultValue={c?.customerId ?? defaults?.customerId ?? ""}
            placeholder="Kunde wählen …"
            options={customers.map((x) => ({ value: x.id, label: x.name }))}
            required
          />
        </Field>
        <Field label="Zählt für Monat" name="periodMonth" hint="Für das monatliche Video-Soll">
          <Input type="month" name="periodMonth" defaultValue={c?.periodMonth ?? defaults?.periodMonth} required />
        </Field>
        <Field label="Titel / Thema" name="title" required className="sm:col-span-2">
          <Input name="title" defaultValue={c?.title} placeholder="z. B. Behind the Scenes Küche" required autoFocus={!c} />
        </Field>
        <Field label="Format" name="format">
          <Select name="format" defaultValue={c?.format ?? "reel"} options={CONTENT_FORMATS} />
        </Field>
        <Field label="Status" name="status">
          <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)} options={CONTENT_STATUS} />
        </Field>
        <div className="sm:col-span-2">
          <p className="label">Plattformen</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.filter((p) => !["google", "website"].includes(p.value)).map((p) => (
              <label key={p.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="platforms"
                  value={p.value}
                  defaultChecked={c ? c.platforms.includes(p.value) : ["instagram", "tiktok"].includes(p.value)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-xs text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-fg">
                  <PlatformIcon platform={p.value} className="size-3.5" />
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <Field label="Zuständig" name="assigneeId">
          <Select name="assigneeId" defaultValue={c?.assigneeId ?? ""} placeholder="– offen –" options={users.map((u) => ({ value: u.id, label: u.name }))} />
        </Field>
        <Field label="Deadline (fertig bis)" name="dueDate">
          <Input type="date" name="dueDate" defaultValue={c?.dueDate ?? ""} />
        </Field>
        <Field label="Drehtermin" name="shootDate">
          <Input type="date" name="shootDate" value={shootDate} onChange={(e) => setShootDate(e.target.value)} />
        </Field>
        <Field label="Veröffentlichung geplant am" name="publishDate">
          <Input type="date" name="publishDate" defaultValue={c?.publishDate ?? ""} />
        </Field>
        {shootDate && shootDate !== c?.shootDate && (
          <div className="flex items-end gap-3 rounded-lg bg-surface-2 p-3 sm:col-span-2">
            <Checkbox name="createShootEvent" defaultChecked label="Drehtermin im Kalender eintragen" description="Zählt als Vor-Ort-Termin beim Kunden" className="flex-1" />
            <Input type="time" name="shootTime" defaultValue="10:00" className="w-28" />
          </div>
        )}
        <Field label="Idee / Hook / Skript" name="concept" className="sm:col-span-2">
          <Textarea name="concept" rows={4} defaultValue={c?.concept ?? ""} placeholder="Hook in den ersten 2 Sekunden, Ablauf, Musik, Text-Overlay …" />
        </Field>
        <Field label="Notizen" name="notes" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={c?.notes ?? ""} />
        </Field>
        {(status === "veroeffentlicht" || status === "eingeplant" || c?.publishedUrl) && (
          <Field
            label="Link zum veröffentlichten Beitrag"
            name="publishedUrl"
            className="sm:col-span-2"
            hint="Wird automatisch als Beitrag in der Performance-Auswertung angelegt"
          >
            <Input name="publishedUrl" defaultValue={c?.publishedUrl ?? ""} placeholder="https://www.tiktok.com/@…/video/…" />
          </Field>
        )}
        <Checkbox name="clientApproved" defaultChecked={c?.clientApproved} label="Vom Kunden freigegeben" className="sm:col-span-2" />
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>{c ? "Speichern" : "Anlegen"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
