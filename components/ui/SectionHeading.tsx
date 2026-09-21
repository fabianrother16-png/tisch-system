import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  const textTone = tone === "light" ? "text-cream" : "text-anthracite";
  const subTone = tone === "light" ? "text-cream/70" : "text-anthracite/65";
  const accentTone = tone === "light" ? "text-terracotta-light" : "text-terracotta-dark";

  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className={`eyebrow ${accentTone}`}>{eyebrow}</span>
      <h2
        className={`mt-5 text-4xl font-semibold leading-[1.05] tracking-tightest sm:text-5xl md:text-6xl ${textTone}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-6 text-lg leading-relaxed ${subTone}`}>{description}</p>
      )}
    </div>
  );
}
