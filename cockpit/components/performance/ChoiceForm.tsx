"use client";

import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Select } from "@/components/ui/inputs";
import type { ActionState } from "@/lib/actions/types";

export function ChoiceForm({ action, choices }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; choices: { id: string; name: string }[] }) {
  return (
    <ActionForm action={action} className="flex gap-2" keepOpen>
      <Select name="choice" options={choices.map((c) => ({ value: c.id, label: c.name }))} className="flex-1 py-1.5 text-sm" />
      <SubmitButton size="sm">Übernehmen</SubmitButton>
    </ActionForm>
  );
}
