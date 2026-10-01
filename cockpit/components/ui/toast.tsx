"use client";

import { useSyncExternalStore } from "react";
import { CircleCheck, CircleAlert, X } from "lucide-react";
import { cn } from "./cn";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function push(message: string, tone: Toast["tone"]) {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = Object.assign((message: string) => push(message, "success"), {
  success: (message: string) => push(message, "success"),
  error: (message: string) => push(message, "error"),
  info: (message: string) => push(message, "info"),
});

const empty: Toast[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => empty,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
            "border-line bg-surface text-fg",
          )}
        >
          {t.tone === "error" ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          )}
          <p className="flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="Schließen">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
