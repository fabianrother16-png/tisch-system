"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, Textarea } from "@/components/ui/inputs";
import type { ActionState } from "@/lib/actions/types";
import type { Contact } from "@/lib/db/schema";

export function ContactForm({
  action,
  contact,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  contact?: Contact;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required>
          <Input name="name" defaultValue={contact?.name} required autoFocus />
        </Field>
        <Field label="Position" name="position">
          <Input name="position" defaultValue={contact?.position ?? ""} />
        </Field>
        <Field label="E-Mail" name="email">
          <Input type="email" name="email" defaultValue={contact?.email ?? ""} />
        </Field>
        <Field label="Telefon" name="phone">
          <Input type="tel" name="phone" defaultValue={contact?.phone ?? ""} />
        </Field>
      </div>
      <Field label="Notiz" name="notes">
        <Textarea name="notes" rows={2} defaultValue={contact?.notes ?? ""} />
      </Field>
      <Checkbox name="isPrimary" defaultChecked={contact?.isPrimary} label="Hauptansprechpartner" description="Wird für Angebote, Rechnungen und E-Mails vorausgewählt." />
      <FormActions>
        <CancelButton />
        <SubmitButton>Speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
