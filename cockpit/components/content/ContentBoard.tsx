"use client";

import { startTransition, useOptimistic, useState } from "react";
import { CalendarDays, ChevronRight, Camera, CheckCircle2, Trash2 } from "lucide-react";
import { Dialog, ModalProvider } from "@/components/ui/Modal";
import { Avatar, CustomerMark } from "@/components/ui/Avatar";
import { ActionButton } from "@/components/ui/form";
import { PlatformIcon } from "@/components/PlatformIcon";
import { toast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { CONTENT_FORMAT_MAP, CONTENT_STATUS } from "@/lib/constants";
import { deleteContent, moveContent, saveContent } from "@/lib/actions/content";
import { fmtDateShort } from "@/lib/format";
import type { Content } from "@/lib/db/schema";
import { ContentForm, type Option } from "./ContentForm";

export type BoardItem = Content & {
  customerName: string;
  customerColor: string;
  assigneeName: string | null;
  assigneeColor: string | null;
};

const COLUMN_ACCENT: Record<string, string> = {
  idee: "bg-zinc-400",
  geplant: "bg-sky-500",
  dreh: "bg-violet-500",
  schnitt: "bg-orange-500",
  freigabe: "bg-amber-400",
  eingeplant: "bg-blue-600",
  veroeffentlicht: "bg-emerald-500",
};

export function ContentBoard({
  items,
  customers,
  users,
  month,
  today,
}: {
  items: BoardItem[];
  customers: Option[];
  users: Option[];
  month: string;
  today: string;
}) {
  const [optimistic, move] = useOptimistic(items, (state, update: { id: number; status: string }) =>
    state.map((i) => (i.id === update.id ? { ...i, status: update.status } : i)),
  );
  const [editing, setEditing] = useState<BoardItem | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const doMove = (id: number, status: string) => {
    startTransition(async () => {
      move({ id, status });
      const res = await moveContent(id, status);
      if (res && !res.ok && res.message) toast.error(res.message);
    });
  };

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[1050px] grid-cols-7 gap-3">
          {CONTENT_STATUS.map((col, colIndex) => {
            const colItems = optimistic.filter((i) => i.status === col.value);
            const next = CONTENT_STATUS[colIndex + 1];
            return (
              <div
                key={col.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.value);
                }}
                onDragLeave={() => setDragOver((d) => (d === col.value ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = Number(e.dataTransfer.getData("text/plain"));
                  const item = optimistic.find((i) => i.id === id);
                  if (item && item.status !== col.value) doMove(id, col.value);
                }}
                className={cn(
                  "flex min-h-[420px] flex-col rounded-xl border border-line bg-surface-2/70 transition-colors",
                  dragOver === col.value && "border-accent bg-accent-soft/50",
                )}
              >
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <span className={cn("size-2 rounded-full", COLUMN_ACCENT[col.value])} />
                  <span className="text-xs font-semibold">{col.label}</span>
                  <span className="ml-auto rounded-full bg-surface px-1.5 text-[11px] text-muted num">{colItems.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {colItems.map((item) => {
                    const overdue = item.dueDate && item.dueDate < today && !["eingeplant", "veroeffentlicht"].includes(item.status);
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", String(item.id))}
                        onClick={() => setEditing(item)}
                        className="group cursor-pointer rounded-lg border border-line bg-surface p-2.5 shadow-xs transition hover:border-line-strong hover:shadow-sm active:cursor-grabbing"
                      >
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <CustomerMark name={item.customerName} color={item.customerColor} size="sm" />
                          <span className="truncate text-[11px] font-medium text-muted">{item.customerName}</span>
                        </div>
                        <p className="text-[13px] leading-snug font-medium">{item.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                          <span className="rounded bg-surface-3 px-1.5 py-0.5">{CONTENT_FORMAT_MAP[item.format]?.label ?? item.format}</span>
                          {item.platforms.map((p) => (
                            <PlatformIcon key={p} platform={p} className="size-3.5" />
                          ))}
                          {item.clientApproved && <CheckCircle2 className="size-3.5 text-emerald-600" />}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {item.shootDate && ["idee", "geplant", "dreh"].includes(item.status) && (
                              <span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300">
                                <Camera className="size-3" /> {fmtDateShort(item.shootDate)}
                              </span>
                            )}
                            {item.dueDate && !["eingeplant", "veroeffentlicht"].includes(item.status) && (
                              <span className={cn("inline-flex items-center gap-1", overdue ? "font-semibold text-red-600" : "text-muted")}>
                                <CalendarDays className="size-3" /> {fmtDateShort(item.dueDate)}
                              </span>
                            )}
                            {item.status === "eingeplant" && item.publishDate && (
                              <span className="text-muted">geht online am {fmtDateShort(item.publishDate)}</span>
                            )}
                            {item.status === "veroeffentlicht" && item.publishDate && (
                              <span className="text-muted">online seit {fmtDateShort(item.publishDate)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {item.assigneeName && <Avatar name={item.assigneeName} color={item.assigneeColor} size="xs" />}
                            {next && (
                              <button
                                title={`Weiter: ${next.label}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  doMove(item.id, next.value);
                                }}
                                className="rounded p-0.5 text-muted opacity-0 transition hover:bg-surface-3 hover:text-fg group-hover:opacity-100 max-lg:opacity-100"
                              >
                                <ChevronRight className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {editing && (
        <Dialog title="Content bearbeiten" size="lg" onClose={() => setEditing(null)}>
          <EditBody item={editing} customers={customers} users={users} month={month} onDone={() => setEditing(null)} />
        </Dialog>
      )}
    </>
  );
}

function EditBody({
  item,
  customers,
  users,
  month,
  onDone,
}: {
  item: BoardItem;
  customers: Option[];
  users: Option[];
  month: string;
  onDone: () => void;
}) {
  return (
    <div>
      <ModalProvider close={onDone}>
        <ContentForm action={saveContent.bind(null, item.id)} content={item} customers={customers} users={users} defaults={{ periodMonth: month }} />
      </ModalProvider>
      <div className="mt-4 border-t border-line pt-4">
        <ActionButton action={async () => { const r = await deleteContent(item.id); onDone(); return r; }} confirm="Diesen Content löschen?" variant="ghost">
          <Trash2 /> Löschen
        </ActionButton>
      </div>
    </div>
  );
}
