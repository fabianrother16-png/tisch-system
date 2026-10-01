"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select } from "@/components/ui/inputs";
import { FILE_CATEGORIES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { StoredFile } from "@/lib/db/schema";

export function FileEditForm({ action, file, customers }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; file: StoredFile; customers: { id: number; name: string }[] }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Name" name="name" required>
        <Input name="name" defaultValue={file.name} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kunde" name="customerId">
          <Select name="customerId" defaultValue={file.customerId ?? ""} placeholder="– intern / GbR –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Ordner" name="category">
          <Select name="category" defaultValue={file.category} options={FILE_CATEGORIES} />
        </Field>
      </div>
      <Field label="Notiz" name="notes">
        <Input name="notes" defaultValue={file.notes ?? ""} />
      </Field>
      <FormActions>
        <CancelButton />
        <SubmitButton>Speichern</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
