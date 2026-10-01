"use client";

import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { Input } from "@/components/ui/inputs";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={loginAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-Mail" name="email">
        <Input name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Passwort" name="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg">
        Anmelden
      </SubmitButton>
    </ActionForm>
  );
}
