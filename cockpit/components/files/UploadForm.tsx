"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select } from "@/components/ui/inputs";
import { FILE_CATEGORIES } from "@/lib/constants";
import { uploadFiles } from "@/lib/actions/files";

export function UploadForm({ customers, defaultCustomerId, defaultCategory }: { customers: { id: number; name: string }[]; defaultCustomerId?: number; defaultCategory?: string }) {
  return (
    <ActionForm action={uploadFiles} className="space-y-4">
      <Field label="Dateien" name="files" required hint="PDF, Bilder, Word, Excel … max. 10 MB je Datei. Große Videos besser in eurer Cloud ablegen und hier verlinken.">
        <Input type="file" name="files" multiple required className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-2 file:py-1 file:text-xs" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kunde" name="customerId">
          <Select name="customerId" defaultValue={defaultCustomerId ?? ""} placeholder="– intern / GbR –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Ordner" name="category">
          <Select name="category" defaultValue={defaultCategory ?? "sonstiges"} options={FILE_CATEGORIES} />
        </Field>
      </div>
      <Field label="Notiz" name="notes">
        <Input name="notes" placeholder="optional" />
      </Field>
      <FormActions>
        <CancelButton />
        <SubmitButton>Hochladen</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
