"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, Textarea } from "@/components/ui/inputs";
import { Paperclip, Send } from "lucide-react";
import type { ActionState } from "@/lib/actions/types";

export function SendMailForm({
  action,
  draft,
  attachments,
  showXml,
  warnings,
  submitLabel = "Senden",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  draft: { to: string; subject: string; body: string };
  attachments: string[];
  showXml?: boolean;
  warnings?: string[];
  submitLabel?: string;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="An" name="to" required>
          <Input name="to" type="email" defaultValue={draft.to} required multiple />
        </Field>
        <Field label="CC" name="cc">
          <Input name="cc" type="email" multiple />
        </Field>
      </div>
      <Field label="Betreff" name="subject">
        <Input name="subject" defaultValue={draft.subject} required />
      </Field>
      <Field label="Nachricht" name="body">
        <Textarea name="body" rows={9} defaultValue={draft.body} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-xs">
            <Paperclip className="size-3.5" /> {a}
          </span>
        ))}
      </div>
      {showXml && (
        <div className="rounded-lg bg-surface-2 p-3">
          <Checkbox
            name="xml"
            label="E-Rechnung (XRechnung-XML) zusätzlich anhängen"
            description={
              warnings && warnings.length
                ? `Für eine gültige E-Rechnung fehlt noch: ${warnings.join(", ")}`
                : "Ab 2027/2028 im B2B-Bereich Pflicht – viele Buchhaltungsprogramme lesen sie automatisch ein."
            }
          />
        </div>
      )}
      <FormActions>
        <CancelButton />
        <SubmitButton>
          <Send /> {submitLabel}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
