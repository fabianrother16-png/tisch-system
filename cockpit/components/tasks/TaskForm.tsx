"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select, Textarea } from "@/components/ui/inputs";
import { TASK_PRIORITY } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { Task } from "@/lib/db/schema";

type Option = { id: number; name: string };

export function TaskForm({
  action,
  task,
  customers,
  users,
  defaults,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  task?: Task;
  customers: Option[];
  users: Option[];
  defaults: { userId: number; customerId?: number };
}) {
  const t = task;
  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Aufgabe" name="title" required>
        <Input name="title" defaultValue={t?.title} required autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kunde" name="customerId">
          <Select name="customerId" defaultValue={t?.customerId ?? defaults.customerId ?? ""} placeholder="– intern –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Zuständig" name="assigneeId">
          <Select name="assigneeId" defaultValue={t ? (t.assigneeId ?? "") : defaults.userId} placeholder="– alle –" options={users.map((u) => ({ value: u.id, label: u.name }))} />
        </Field>
        <Field label="Fällig am" name="dueDate">
          <Input type="date" name="dueDate" defaultValue={t?.dueDate ?? ""} />
        </Field>
        <Field label="Priorität" name="priority">
          <Select name="priority" defaultValue={t?.priority ?? "normal"} options={TASK_PRIORITY} />
        </Field>
      </div>
      <Field label="Details" name="description">
        <Textarea name="description" rows={3} defaultValue={t?.description ?? ""} />
      </Field>
      <FormActions>
        <CancelButton />
        <SubmitButton>{t ? "Speichern" : "Anlegen"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}

export function QuickTaskForm({ action, userId }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; userId: number }) {
  return (
    <ActionForm action={action} resetOnSuccess silent className="flex gap-2">
      <input type="hidden" name="assigneeId" value={userId} />
      <Input name="title" placeholder="Schnell eine Aufgabe notieren und Enter drücken …" required className="flex-1" />
      <Input type="date" name="dueDate" className="w-40" aria-label="Fällig am" />
      <SubmitButton>Hinzufügen</SubmitButton>
    </ActionForm>
  );
}
