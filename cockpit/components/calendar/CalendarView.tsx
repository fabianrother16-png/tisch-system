"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import { Dialog, ModalProvider } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/form";
import { cn } from "@/components/ui/cn";
import { deleteEvent, saveEvent } from "@/lib/actions/events";
import { EVENT_TYPE_MAP } from "@/lib/constants";
import { WEEKDAYS, WEEKDAYS_SHORT, fmtDateLong } from "@/lib/format";
import type { CalendarItem } from "@/lib/domain/calendar";
import { EventForm } from "./EventForm";
import { itemStyle } from "./styles";

type Option = { id: number; name: string };

function ItemChip({ item, onOpen, compact }: { item: CalendarItem; onOpen: (i: CalendarItem) => void; compact?: boolean }) {
  const content = (
    <>
      {item.time && <span className="mr-1 font-semibold num">{item.time}</span>}
      <span className={item.kind !== "event" ? "italic" : ""}>{item.title}</span>
      {!compact && item.customerName && <span className="block truncate text-[11px] opacity-70">{item.customerName}</span>}
    </>
  );
  const cls = cn("block w-full truncate rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-xs transition hover:brightness-95", itemStyle(item));
  if (item.kind === "event") {
    return (
      <button type="button" className={cls} onClick={(e) => { e.stopPropagation(); onOpen(item); }} title={item.title}>
        {content}
      </button>
    );
  }
  return (
    <Link href={item.href ?? "#"} className={cls} onClick={(e) => e.stopPropagation()} title={item.title}>
      {content}
    </Link>
  );
}

export function CalendarView({
  mode,
  days,
  items,
  month,
  today,
  customers,
  users,
  userId,
}: {
  mode: "monat" | "woche" | "agenda";
  days: string[];
  items: CalendarItem[];
  month: string;
  today: string;
  customers: Option[];
  users: Option[];
  userId: number;
}) {
  const [open, setOpen] = useState<CalendarItem | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const itemsOn = (day: string) =>
    items.filter((i) => i.date === day || (i.endDate && i.date < day && i.endDate >= day));

  return (
    <>
      {mode === "monat" && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-xs font-medium text-muted">
            {WEEKDAYS_SHORT.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayItems = itemsOn(day);
              const inMonth = day.startsWith(month);
              const isToday = day === today;
              return (
                <div
                  key={day}
                  onClick={() => setCreateDate(day)}
                  className={cn(
                    "group min-h-28 cursor-pointer border-line p-1.5 transition-colors hover:bg-surface-2 sm:min-h-32",
                    idx % 7 !== 6 && "border-r",
                    idx < days.length - 7 && "border-b",
                    !inMonth && "bg-surface-2/60",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs num",
                        isToday ? "bg-accent font-semibold text-on-accent" : inMonth ? "text-fg" : "text-muted/60",
                      )}
                    >
                      {Number(day.slice(8, 10))}
                    </span>
                    <span className="text-[11px] text-muted opacity-0 group-hover:opacity-100">+ Termin</span>
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 4).map((i) => (
                      <ItemChip key={i.key} item={i} onOpen={setOpen} compact />
                    ))}
                    {dayItems.length > 4 && <p className="px-1 text-[11px] text-muted">+{dayItems.length - 4} weitere</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "woche" && (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="grid min-w-[900px] grid-cols-7 gap-2">
            {days.map((day, i) => {
              const dayItems = itemsOn(day);
              const isToday = day === today;
              return (
                <div key={day} className={cn("card flex min-h-[460px] flex-col", isToday && "ring-2 ring-accent/40")}>
                  <button
                    onClick={() => setCreateDate(day)}
                    className="flex items-baseline justify-between border-b border-line px-3 py-2 text-left hover:bg-surface-2"
                  >
                    <span className="text-xs font-medium text-muted">{WEEKDAYS[i]}</span>
                    <span className={cn("text-lg font-semibold num", isToday && "text-accent")}>{day.slice(8, 10)}.</span>
                  </button>
                  <div className="flex-1 space-y-1.5 p-2">
                    {dayItems.map((it) => (
                      <ItemChip key={it.key} item={it} onOpen={setOpen} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "agenda" && (
        <div className="space-y-4">
          {days.filter((d) => itemsOn(d).length > 0).length === 0 && (
            <div className="card px-6 py-12 text-center text-sm text-muted">Keine Termine in diesem Zeitraum.</div>
          )}
          {days
            .filter((d) => itemsOn(d).length > 0)
            .map((day) => (
              <div key={day} className="card overflow-hidden">
                <div className={cn("flex items-center justify-between border-b border-line px-4 py-2.5", day === today && "bg-accent-soft")}>
                  <p className="text-sm font-semibold">
                    {fmtDateLong(day)}
                    {day === today && <span className="ml-2 text-xs font-medium text-accent">Heute</span>}
                  </p>
                  <button onClick={() => setCreateDate(day)} className="text-xs font-medium text-muted hover:text-fg">+ Termin</button>
                </div>
                <div className="divide-y divide-line">
                  {itemsOn(day).map((it) => (
                    <div key={it.key} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-24 shrink-0 text-sm text-muted num">
                        {it.allDay ? "ganztägig" : `${it.time}${it.endTime ? `–${it.endTime}` : ""}`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <ItemChip item={it} onOpen={setOpen} />
                      </div>
                      <div className="hidden w-48 shrink-0 truncate text-xs text-muted md:block">
                        {it.event?.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {it.event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {open?.event && (
        <Dialog title={EVENT_TYPE_MAP[open.event.type]?.label ?? "Termin"} size="lg" onClose={() => setOpen(null)}>
          <ModalProvider close={() => setOpen(null)}>
            <EventForm
              action={saveEvent.bind(null, open.event.id)}
              event={open.event}
              customers={customers}
              users={users}
              defaults={{ date: open.date, userId }}
            />
          </ModalProvider>
          <div className="mt-4 border-t border-line pt-4">
            <ActionButton
              action={async () => {
                const r = await deleteEvent(open.event!.id);
                setOpen(null);
                return r;
              }}
              confirm="Termin löschen?"
              variant="ghost"
            >
              <Trash2 /> Termin löschen
            </ActionButton>
          </div>
        </Dialog>
      )}

      {createDate && (
        <Dialog title="Neuer Termin" size="lg" onClose={() => setCreateDate(null)}>
          <ModalProvider close={() => setCreateDate(null)}>
            <EventForm action={saveEvent.bind(null, null)} customers={customers} users={users} defaults={{ date: createDate, userId }} />
          </ModalProvider>
        </Dialog>
      )}
    </>
  );
}
