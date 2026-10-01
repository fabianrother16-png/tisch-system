"use client";

import { createContext, startTransition, useActionState, useContext, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ActionState } from "@/lib/actions/types";
import { Button, type ButtonVariant, type ButtonSize } from "./Button";
import { useModal } from "./Modal";
import { toast } from "./toast";
import { cn } from "./cn";

function isRedirectError(err: unknown) {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

const FormStateContext = createContext<{ state: ActionState; pending: boolean }>({ state: null, pending: false });

export function useFormState() {
  return useContext(FormStateContext);
}

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Formular für Server Actions mit Fehleranzeige, Toast und automatischem
 * Schließen eines umgebenden Modals. Eingaben bleiben bei Fehlern erhalten.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
  keepOpen,
  silent,
  id,
}: {
  action: ServerAction;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: (state: NonNullable<ActionState>) => void;
  keepOpen?: boolean;
  silent?: boolean;
  id?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const modal = useModal();
  const router = useRouter();
  // Rückmeldungen direkt nach der Action behandeln – auch wenn das Formular
  // durch die Aktualisierung der Seite anschließend verschwindet.
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    let res: ActionState;
    try {
      res = await action(prev, fd);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      res = { ok: false, message: "Etwas ist schiefgelaufen. Bitte erneut versuchen." };
    }
    if (res?.ok) {
      if (res.message && !silent) toast.success(res.message);
      if (resetOnSuccess) formRef.current?.reset();
      if (!keepOpen) modal?.close();
      onSuccess?.(res);
      if (res.redirectTo) router.push(res.redirectTo);
    } else if (res?.message) {
      toast.error(res.message);
    }
    return res;
  }, null);

  return (
    <FormStateContext.Provider value={{ state, pending }}>
      <form
        id={id}
        ref={formRef}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const fd = new FormData(e.currentTarget, submitter);
          startTransition(() => formAction(fd));
        }}
      >
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

export function FieldError({ name }: { name: string }) {
  const { state } = useFormState();
  const error = state && !state.ok ? state.errors?.[name] : undefined;
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>;
}

export function Field({
  label,
  name,
  hint,
  children,
  className,
  required,
}: {
  label?: React.ReactNode;
  name?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="ml-0.5 text-accent">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {name && <FieldError name={name} />}
    </div>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  name,
  value,
  formAction,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const ctx = useFormState();
  const status = useFormStatus();
  const pending = ctx.pending || status.pending;
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      name={name}
      value={value}
      formAction={formAction}
    >
      {pending && <LoaderCircle className="animate-spin" />}
      {children}
    </Button>
  );
}

export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-6 flex items-center justify-end gap-2", className)}>{children}</div>;
}

export function CancelButton({ children = "Abbrechen" }: { children?: React.ReactNode }) {
  const modal = useModal();
  if (!modal) return null;
  return (
    <Button variant="ghost" onClick={modal.close}>
      {children}
    </Button>
  );
}

/** Button, der eine Server Action ohne Formular-UI auslöst (optional mit Rückfrage). */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "secondary",
  size = "sm",
  className,
  title,
}: {
  action: () => Promise<ActionState | void>;
  children: React.ReactNode;
  confirm?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  title?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      title={title}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          try {
            const res = await action();
            if (res?.ok && res.message) toast.success(res.message);
            if (res && !res.ok && res.message) toast.error(res.message);
            if (res?.redirectTo) router.push(res.redirectTo);
          } catch (err) {
            if (isRedirectError(err)) throw err;
            toast.error("Etwas ist schiefgelaufen. Bitte erneut versuchen.");
          }
        });
      }}
    >
      {pending && <LoaderCircle className="animate-spin" />}
      {children}
    </Button>
  );
}
