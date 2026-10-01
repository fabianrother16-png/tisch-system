"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select, Textarea } from "@/components/ui/inputs";
import { CUSTOMER_COLORS, CUSTOMER_STATUS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { Customer } from "@/lib/db/schema";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-8 gap-y-4 border-b border-line py-6 first:pt-0 last:border-0 md:grid-cols-[220px_1fr]">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function CustomerForm({
  action,
  customer,
  users,
  isNew,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  customer?: Customer;
  users: { id: number; name: string }[];
  isNew?: boolean;
}) {
  const c = customer;
  return (
    <ActionForm action={action} keepOpen={!isNew}>
      <Section title="Stammdaten" description="Wie heißt der Kunde und wer betreut ihn?">
        <Field label="Firmen- / Kundenname" name="name" required className="sm:col-span-2">
          <Input name="name" defaultValue={c?.name} required autoFocus={isNew} />
        </Field>
        <Field label="Branche" name="industry">
          <Input name="industry" defaultValue={c?.industry ?? ""} placeholder="z. B. Restaurant, Handwerk" />
        </Field>
        <Field label="Status" name="status">
          <Select name="status" defaultValue={c?.status ?? "aktiv"} options={CUSTOMER_STATUS} />
        </Field>
        <Field label="Betreut von" name="ownerId">
          <Select name="ownerId" defaultValue={c?.ownerId ?? ""} placeholder="– niemand –" options={users.map((u) => ({ value: u.id, label: u.name }))} />
        </Field>
        <Field label="Kunde seit" name="startDate" hint="Beginn der Zusammenarbeit – Basis für Vorher/Nachher-Vergleiche">
          <Input type="date" name="startDate" defaultValue={c?.startDate ?? ""} />
        </Field>
        <Field label="Wie gewonnen?" name="source">
          <Input name="source" defaultValue={c?.source ?? ""} placeholder="Empfehlung, Kaltakquise, Instagram …" />
        </Field>
        <Field label="Farbe" name="color">
          <div className="flex flex-wrap gap-2 pt-1">
            {CUSTOMER_COLORS.map((col, i) => (
              <label key={col} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={col}
                  defaultChecked={c ? c.color === col : i === 0}
                  className="peer sr-only"
                />
                <span
                  className="block size-6 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-fg"
                  style={{ backgroundColor: col }}
                />
              </label>
            ))}
          </div>
        </Field>
      </Section>

      {isNew && (
        <Section title="Ansprechpartner" description="Hauptkontakt beim Kunden. Weitere Kontakte könnt ihr später ergänzen.">
          <Field label="Name" name="contactName">
            <Input name="contactName" />
          </Field>
          <Field label="Position" name="contactPosition">
            <Input name="contactPosition" placeholder="Inhaber, Marketing …" />
          </Field>
          <Field label="E-Mail" name="contactEmail">
            <Input type="email" name="contactEmail" />
          </Field>
          <Field label="Telefon" name="contactPhone">
            <Input type="tel" name="contactPhone" />
          </Field>
        </Section>
      )}

      <Section title="Kontakt & Adresse" description="Erscheint auf Angeboten und Rechnungen.">
        <Field label="E-Mail (allgemein / Rechnungen)" name="email">
          <Input type="email" name="email" defaultValue={c?.email ?? ""} />
        </Field>
        <Field label="Telefon" name="phone">
          <Input type="tel" name="phone" defaultValue={c?.phone ?? ""} />
        </Field>
        <Field label="Straße & Hausnummer" name="street" className="sm:col-span-2">
          <Input name="street" defaultValue={c?.street ?? ""} />
        </Field>
        <div className="grid grid-cols-[110px_1fr] gap-3 sm:col-span-2">
          <Field label="PLZ" name="zip">
            <Input name="zip" defaultValue={c?.zip ?? ""} />
          </Field>
          <Field label="Ort" name="city">
            <Input name="city" defaultValue={c?.city ?? ""} />
          </Field>
        </div>
        <Field label="Land" name="country">
          <Input name="country" defaultValue={c?.country ?? "Deutschland"} />
        </Field>
        <Field label="USt-IdNr." name="vatId">
          <Input name="vatId" defaultValue={c?.vatId ?? ""} />
        </Field>
        <Field label="Zahlungsziel (Tage)" name="paymentTermDays" hint="Leer = Standard aus den Einstellungen">
          <Input type="number" min={0} name="paymentTermDays" defaultValue={c?.paymentTermDays ?? ""} />
        </Field>
      </Section>

      <Section title="Online-Kanäle" description="Profile des Kunden. Für automatische Zahlen zusätzlich unter „Anbindungen“ verbinden.">
        <Field label="Website" name="website">
          <Input name="website" defaultValue={c?.website ?? ""} placeholder="https://" />
        </Field>
        <Field label="Instagram" name="instagramHandle">
          <Input name="instagramHandle" defaultValue={c?.instagramHandle ?? ""} placeholder="@benutzername" />
        </Field>
        <Field label="TikTok" name="tiktokHandle">
          <Input name="tiktokHandle" defaultValue={c?.tiktokHandle ?? ""} placeholder="@benutzername" />
        </Field>
        <Field label="Facebook-Seite" name="facebookUrl">
          <Input name="facebookUrl" defaultValue={c?.facebookUrl ?? ""} placeholder="https://facebook.com/…" />
        </Field>
        <Field label="YouTube" name="youtubeUrl">
          <Input name="youtubeUrl" defaultValue={c?.youtubeUrl ?? ""} />
        </Field>
        <Field label="Google-Unternehmensprofil (Link)" name="googleBusinessUrl">
          <Input name="googleBusinessUrl" defaultValue={c?.googleBusinessUrl ?? ""} placeholder="https://maps.app.goo.gl/…" />
        </Field>
        <Field
          label="Google Place ID"
          name="googlePlaceId"
          hint="Für den automatischen Abruf von Sternen & Bewertungsanzahl"
          className="sm:col-span-2"
        >
          <Input name="googlePlaceId" defaultValue={c?.googlePlaceId ?? ""} placeholder="ChIJ…" />
        </Field>
      </Section>

      <Section title="Notizen" description="Interne Infos, Besonderheiten, Wünsche.">
        <Field name="notes" className="sm:col-span-2">
          <Textarea name="notes" rows={4} defaultValue={c?.notes ?? ""} />
        </Field>
      </Section>

      <FormActions>
        <CancelButton />
        <SubmitButton>{isNew ? "Kunde anlegen" : "Speichern"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
