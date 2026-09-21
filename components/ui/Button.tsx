import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "light";
type Variant = ButtonVariant;

export const buttonBase =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-sans text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-60";
const base = buttonBase;

export const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-terracotta-dark text-cream hover:bg-anthracite active:scale-[0.98]",
  secondary:
    "bg-anthracite text-cream hover:bg-anthracite-light active:scale-[0.98]",
  ghost:
    "border border-current bg-transparent hover:bg-anthracite hover:text-cream active:scale-[0.98]",
  light:
    "bg-cream text-anthracite hover:bg-anthracite hover:text-cream active:scale-[0.98]",
};
const variants = buttonVariants;

type CommonProps = {
  variant?: Variant;
  showArrow?: boolean;
  children: ReactNode;
  className?: string;
};

export function ButtonLink({
  href,
  variant = "primary",
  showArrow = true,
  children,
  className = "",
  ...rest
}: CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
      {showArrow && (
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      )}
    </a>
  );
}

export function Button({
  variant = "primary",
  showArrow = false,
  children,
  className = "",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
      {showArrow && (
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
