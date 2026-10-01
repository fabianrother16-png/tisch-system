"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, MoneyInput, Select } from "@/components/ui/inputs";
import { PAYMENT_METHODS } from "@/lib/constants";
import { centsToInput } from "@/lib/format";
import type { ActionState } from "@/lib/actions/types";

export function PaymentForm({
  action,
  open,
  today,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  open: number;
  today: string;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Zahlungseingang am" name="date" required>
          <Input type="date" name="date" defaultValue={today} required />
        </Field>
        <Field label="Betrag" name="amount" required>
          <MoneyInput name="amount" defaultValue={centsToInput(open)} required />
        </Field>
        <Field label="Zahlungsart" name="method">
          <Select name="method" defaultValue="ueberweisung" options={PAYMENT_METHODS} />
        </Field>
        <Field label="Notiz" name="note">
          <Input name="note" placeholder="z. B. Verwendungszweck" />
        </Field>
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>Zahlung erfassen</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
