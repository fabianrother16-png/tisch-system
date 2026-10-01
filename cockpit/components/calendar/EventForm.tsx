"use client";

import { useState } from "react";
import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/inputs";
import { EVENT_TYPES, VISIT_EVENT_TYPES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { CalendarEvent } from "@/lib/db/schema";

type Option = { id: number; name: string };

export function EventForm({
  action,
  event,
  customers,
  users,
  defaults,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  event?: CalendarEvent;
  customers: Option[];
  users: Option[];
  defaults: { date: string; customerId?: number; userId: number; type?: string };
}) {
  const e = event;
  const [allDay, setAllDay] = useState(e?.allDay ?? false);
  const [type, setType] = useState(e?.type ?? defaults.type ?? "vor_ort");
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titel" name="title" required className="sm:col-span-2">
          <Input name="title" defaultValue={e?.title} placeholder="z. B. Dreh Mittagstisch" required autoFocus={!e} />
        </Field>
        <Field label="Art" name="type">
          <Select name="type" value={type} onChange={(ev) => setType(ev.target.value)} options={EVENT_TYPES} />
        </Field>
        <Field label="Kunde" name="customerId">
          <Select name="customerId" defaultValue={e?.customerId ?? defaults.customerId ?? ""} placeholder="– kein Kunde –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Datum" name="date" required>
          <Input type="date" name="date" defaultValue={e?.start.slice(0, 10) ?? defaults.date} required />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox name="allDay" checked={allDay} onChange={(ev) => setAllDay(ev.target.checked)} label="Ganztägig" />
        </div>
        {allDay ? (
          <Field label="Bis einschließlich (optional)" name="endDate">
            <Input type="date" name="endDate" defaultValue={e?.end?.slice(0, 10) ?? ""} />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <Field label="Von" name="startTime">
              <Input type="time" name="startTime" defaultValue={e && !e.allDay ? e.start.slice(11, 16) : "10:00"} />
            </Field>
            <Field label="Bis" name="endTime">
              <Input type="time" name="endTime" defaultValue={e?.end && !e.allDay ? e.end.slice(11, 16) : "11:00"} />
            </Field>
          </div>
        )}
        <Field label="Ort" name="location" className="sm:col-span-2">
          <Input name="location" defaultValue={e?.location ?? ""} placeholder="Adresse, Zoom-Link …" />
        </Field>
        <div className="sm:col-span-2">
          <p className="label">Wer ist dabei?</p>
          <div className="flex flex-wrap gap-4">
            {users.map((u) => (
              <Checkbox key={u.id} name="assigneeIds" value={u.id} label={u.name} defaultChecked={e ? e.assigneeIds.includes(u.id) : u.id === defaults.userId} />
            ))}
          </div>
        </div>
        <Field label="Notizen" name="notes" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={e?.notes ?? ""} />
        </Field>
        <Checkbox
          key={type}
          name="countsAsVisit"
          defaultChecked={e ? e.countsAsVisit : VISIT_EVENT_TYPES.includes(type)}
          label="Zählt als Vor-Ort-Termin beim Kunden"
          description="Wird auf die im Vertrag vereinbarten Besuche pro Monat angerechnet"
          className="sm:col-span-2"
        />
        {!e && <Checkbox name="prepTask" label="Aufgabe „Vorbereiten“ für den Vortag anlegen" className="sm:col-span-2" />}
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>{e ? "Speichern" : "Eintragen"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
