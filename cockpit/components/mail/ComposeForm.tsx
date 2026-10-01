"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select, Textarea } from "@/components/ui/inputs";
import { composeMail } from "@/lib/actions/mail";

type CustomerOption = { id: number; name: string; email: string | null; contactName: string | null };

export function ComposeForm({
  customers,
  defaults,
}: {
  customers: CustomerOption[];
  defaults?: { customerId?: number; to?: string; subject?: string; body?: string; inReplyTo?: string };
}) {
  const initial = customers.find((c) => c.id === defaults?.customerId);
  const [to, setTo] = useState(defaults?.to ?? initial?.email ?? "");
  const [body, setBody] = useState(defaults?.body ?? (initial?.contactName ? `Hallo ${initial.contactName.split(" ")[0]},\n\n` : ""));
  return (
    <ActionForm action={composeMail} className="space-y-4">
      {defaults?.inReplyTo && <input type="hidden" name="inReplyTo" value={defaults.inReplyTo} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kunde" name="customerId" hint="Die Mail erscheint dann in der Kundenakte">
          <Select
            name="customerId"
            defaultValue={defaults?.customerId ?? ""}
            placeholder="– keinem Kunden zuordnen –"
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(e) => {
              const c = customers.find((x) => String(x.id) === e.target.value);
              if (c?.email && !to) setTo(c.email);
              if (c?.contactName && !body.trim()) setBody(`Hallo ${c.contactName.split(" ")[0]},\n\n`);
            }}
          />
        </Field>
        <Field label="An" name="to" required>
          <Input name="to" type="email" multiple value={to} onChange={(e) => setTo(e.target.value)} required />
        </Field>
        <Field label="CC" name="cc">
          <Input name="cc" type="email" multiple />
        </Field>
        <Field label="Betreff" name="subject" required>
          <Input name="subject" defaultValue={defaults?.subject} required />
        </Field>
      </div>
      <Field label="Nachricht" name="body" hint="Eure Signatur aus den Einstellungen wird automatisch angehängt.">
        <Textarea name="body" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <Field label="Anhänge" name="attachments">
        <Input type="file" name="attachments" multiple className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-2 file:py-1 file:text-xs" />
      </Field>
      <FormActions>
        <CancelButton />
        <SubmitButton>
          <Send /> Senden
        </SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
