"use client";

import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Select, Textarea } from "@/components/ui/inputs";
import type { ActionState } from "@/lib/actions/types";

export function NoteForm({ action }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState> }) {
  return (
    <ActionForm action={action} resetOnSuccess silent className="space-y-2">
      <Textarea name="body" rows={2} placeholder="Notiz, Gesprächsprotokoll, Absprache …" required />
      <div className="flex items-center justify-between gap-2">
        <Select
          name="kind"
          className="w-auto py-1.5 text-xs"
          options={[
            { value: "notiz", label: "Notiz" },
            { value: "anruf", label: "Telefonat" },
            { value: "meeting", label: "Meeting" },
            { value: "email", label: "E-Mail" },
          ]}
        />
        <SubmitButton size="sm">Speichern</SubmitButton>
      </div>
    </ActionForm>
  );
}
