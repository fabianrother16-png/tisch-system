"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

const ModalContext = createContext<{ close: () => void } | null>(null);

export function useModal() {
  return useContext(ModalContext);
}

/** Für frei gesteuerte Dialoge: gibt enthaltenen Formularen eine close()-Funktion. */
export function ModalProvider({ close, children }: { close: () => void; children: React.ReactNode }) {
  return <ModalContext.Provider value={{ close }}>{children}</ModalContext.Provider>;
}

export function Modal({
  trigger,
  title,
  description,
  children,
  size = "md",
  defaultOpen = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <span className="contents" onClick={() => setOpen(true)}>
        {trigger}
      </span>
      {open && (
        <Dialog title={title} description={description} size={size} onClose={close}>
          <ModalContext.Provider value={{ close }}>{children}</ModalContext.Provider>
        </Dialog>
      )}
    </>
  );
}

export function Dialog({
  title,
  description,
  children,
  size = "md",
  onClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        widths[size],
      )}
    >
      <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-md p-1 text-muted hover:bg-surface-3 hover:text-fg"
            aria-label="Schließen"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  );
}
