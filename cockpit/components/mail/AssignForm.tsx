"use client";

import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Select } from "@/components/ui/inputs";
import type { ActionState } from "@/lib/actions/types";

export function AssignForm({
  action,
  customers,
  current,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  customers: { id: number; name: string }[];
  current: number | null;
}) {
  return (
    <ActionForm action={action} className="space-y-2" keepOpen>
      <Select name="customerId" defaultValue={current ?? ""} placeholder="– keiner –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
      <SubmitButton size="sm" variant="secondary">Zuordnen</SubmitButton>
    </ActionForm>
  );
}
