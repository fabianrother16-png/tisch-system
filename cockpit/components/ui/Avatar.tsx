import { initials } from "@/lib/format";
import { cn } from "./cn";

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { xs: "size-5 text-[9px]", sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-sm" };
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color || "#6f665d" }}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function CustomerMark({
  name,
  color,
  size = "md",
}: {
  name: string;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "size-7 text-[11px] rounded-md", md: "size-9 text-xs rounded-lg", lg: "size-14 text-lg rounded-xl" };
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-semibold", sizes[size])}
      style={{ backgroundColor: `${color || "#7A5C33"}1f`, color: color || "#7A5C33" }}
    >
      {initials(name) || "?"}
    </span>
  );
}
