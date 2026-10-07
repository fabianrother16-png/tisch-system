"use client";

// UI-Bausteine des Studios (dunkles Arbeitswerkzeug im SICHTWERK-Look).

import { Check, Copy, Loader2, X } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-terracotta text-cream hover:bg-terracotta-light disabled:hover:bg-terracotta",
  secondary: "bg-ink-600 text-cream hover:bg-ink-500 disabled:hover:bg-ink-600",
  ghost: "bg-transparent text-cream/80 hover:bg-ink-600 hover:text-cream",
  danger: "bg-transparent text-red-300 hover:bg-red-500/15",
};

export function Btn({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        BTN_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-cream/[0.07] bg-ink-800 p-5 sm:p-6", className)}>{children}</div>;
}

export function SectionTitle({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta-light">{eyebrow}</p>}
        <h2 className="font-serif text-xl font-semibold text-cream sm:text-2xl">{title}</h2>
        {children && <div className="mt-1 text-sm text-cream/60">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-cream/60">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-cream/45">{hint}</p>}
    </div>
  );
}

const INPUT_BASE =
  "rounded-xl border border-cream/10 bg-ink-900 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta";
const INPUT = `w-full ${INPUT_BASE}`;

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(INPUT, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(INPUT, "resize-y", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  // "w-auto" im className ersetzt die Standardbreite (sonst gewinnt w-full).
  const auto = props.className?.split(/\s+/).includes("w-auto");
  return <select {...props} className={cx(auto ? INPUT_BASE : INPUT, "appearance-auto", props.className)} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-ink-500 transition-colors peer-checked:bg-terracotta peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-cream transition-transform peer-checked:translate-x-4" />
      </span>
      <span>
        <span className="block text-sm font-medium text-cream">{label}</span>
        {hint && <span className="block text-xs text-cream/50">{hint}</span>}
      </span>
    </label>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";
const TONES: Record<Tone, string> = {
  neutral: "bg-ink-600 text-cream/75",
  success: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/15 text-red-300",
  accent: "bg-terracotta/20 text-terracotta-light",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span title={title} className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("h-4 w-4 animate-spin", className)} aria-hidden />;
}

export function Empty({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream/10 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-terracotta-light">{icon}</div>}
      <p className="font-serif text-lg font-semibold text-cream">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-cream/55">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-700 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-cream/45">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-cream">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-cream/45">{hint}</p>}
    </div>
  );
}

export function scoreTone(score: number, max = 100): Tone {
  const r = score / max;
  if (r >= 0.75) return "success";
  if (r >= 0.5) return "warning";
  return "danger";
}

export function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#34d399" : value >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? "Score"}: ${value} von 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(245,241,232,0.1)" strokeWidth={7} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="#F5F1E8" fontSize={size * 0.3} fontWeight={700}>
          {value}
        </text>
      </svg>
      {label && <span className="mt-1 text-xs text-cream/55">{label}</span>}
    </div>
  );
}

export function Bar({ value, max = 10, label }: { value: number; max?: number; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-cream/70">{label}</span>
        <span className="font-semibold text-cream">
          {value.toLocaleString("de-DE", { maximumFractionDigits: 1 })}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-600">
        <div className={cx("h-1.5 rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-ink-600" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 rounded-full bg-terracotta transition-[width] duration-300" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function CopyButton({ text, label = "Kopieren" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <Btn
      size="sm"
      variant="secondary"
      icon={done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
        } catch {
          window.prompt("Zum Kopieren markieren:", text);
        }
      }}
    >
      {done ? "Kopiert" : label}
    </Btn>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-800 p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            "whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            value === tab.id ? "bg-ink-600 text-cream" : "text-cream/55 hover:text-cream",
          )}
        >
          {tab.label}
          {tab.count != null && <span className="ml-1.5 text-xs text-cream/40">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-cream/10 bg-ink-800 p-5 shadow-2xl sm:rounded-2xl sm:p-6",
          wide ? "sm:max-w-4xl" : "sm:max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-semibold text-cream">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-cream/60 hover:bg-ink-600 hover:text-cream" aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{children}</div>;
}

export function InfoNote({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{children}</div>;
}

export function List({ items, tone = "neutral" }: { items: ReactNode[]; tone?: "neutral" | "good" | "bad" }) {
  const dot = tone === "good" ? "bg-emerald-400" : tone === "bad" ? "bg-red-400" : "bg-terracotta-light";
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-cream/85">
          <span className={cx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
