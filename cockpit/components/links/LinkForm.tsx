"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select } from "@/components/ui/inputs";
import { LINK_CHANNELS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { TrackingLink } from "@/lib/db/schema";

export function LinkForm({
  action,
  link,
  customers,
  baseUrl,
  defaultCustomerId,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  link?: TrackingLink;
  customers: { id: number; name: string }[];
  baseUrl: string;
  defaultCustomerId?: number;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bezeichnung" name="label" required className="sm:col-span-2">
          <Input name="label" defaultValue={link?.label} placeholder="z. B. NFC-Karte Tresen, Google-Profil Website-Link" required autoFocus />
        </Field>
        <Field label="Ziel-Adresse" name="targetUrl" required className="sm:col-span-2" hint="Wohin soll weitergeleitet werden? z. B. Google-Bewertungslink, Website, Speisekarte">
          <Input name="targetUrl" defaultValue={link?.targetUrl} placeholder="https://g.page/r/…/review" required />
        </Field>
        <Field label="Kunde" name="customerId">
          <Select name="customerId" defaultValue={link?.customerId ?? defaultCustomerId ?? ""} placeholder="– intern –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Kanal" name="channel">
          <Select name="channel" defaultValue={link?.channel ?? "nfc"} options={LINK_CHANNELS} />
        </Field>
        <Field label="Kurz-Adresse (optional)" name="slug" className="sm:col-span-2" hint={`Ergibt ${baseUrl}/go/… – leer lassen für ein zufälliges Kürzel`}>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted">/go/</span>
            <Input name="slug" defaultValue={link?.slug} placeholder="cafe-mueller-nfc" />
          </div>
        </Field>
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>{link ? "Speichern" : "Link erstellen"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
