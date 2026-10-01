"use client";

import { startTransition, useOptimistic } from "react";
import { Check } from "lucide-react";
import { toggleTask } from "@/lib/actions/tasks";
import { cn } from "@/components/ui/cn";

export function TaskCheck({ id, done }: { id: number; done: boolean }) {
  const [optimisticDone, setDone] = useOptimistic(done);
  return (
    <button
      type="button"
      aria-label={optimisticDone ? "Als offen markieren" : "Als erledigt markieren"}
      onClick={() =>
        startTransition(async () => {
          setDone(!optimisticDone);
          await toggleTask(id);
        })
      }
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        optimisticDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-line-strong hover:border-accent",
      )}
    >
      {optimisticDone && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}
