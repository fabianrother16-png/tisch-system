"use client";

import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input } from "@/components/ui/inputs";
import { setupAction } from "@/lib/actions/auth";

export function SetupForm() {
  return (
    <ActionForm action={setupAction} className="mt-6 space-y-6">
      <Field label="Firmenname" name="companyName" required>
        <Input name="companyName" defaultValue="SICHTWERK" required />
      </Field>
      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Dein Zugang</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required>
            <Input name="name" autoComplete="name" required />
          </Field>
          <Field label="E-Mail" name="email" required>
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
        </div>
        <Field label="Passwort" name="password" hint="Mindestens 10 Zeichen" required>
          <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
        </Field>
      </fieldset>
      <fieldset className="space-y-4 rounded-xl border border-line bg-surface-2 p-4">
        <legend className="px-1 text-sm font-semibold">Zugang für deinen Bruder / Mitgesellschafter (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="partnerName">
            <Input name="partnerName" />
          </Field>
          <Field label="E-Mail" name="partnerEmail">
            <Input name="partnerEmail" type="email" />
          </Field>
        </div>
        <Field label="Passwort" name="partnerPassword" hint="Kann später in den Einstellungen geändert werden">
          <Input name="partnerPassword" type="password" autoComplete="new-password" />
        </Field>
      </fieldset>
      <Checkbox
        name="demo"
        defaultChecked
        label="Beispieldaten laden"
        description="Füllt die Software mit erfundenen Demo-Kunden, Videos, Rechnungen und Zahlen, damit ihr alles ausprobieren könnt. Lässt sich in den Einstellungen mit einem Klick wieder entfernen."
      />
      <SubmitButton className="w-full" size="lg">
        Cockpit einrichten
      </SubmitButton>
    </ActionForm>
  );
}
