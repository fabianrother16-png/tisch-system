"use client";

import { CopyButton } from "../CopyButton";

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="not-prose group relative my-4 overflow-hidden rounded-xl bg-anthracite">
      <div className="flex items-center justify-between px-3 pt-2 text-[11px] uppercase tracking-wide text-cream/50">
        <span>{lang || "Text"}</span>
        <CopyButton text={code} className="btn-sm btn rounded-lg bg-anthracite-lighter px-2 py-1 text-cream hover:bg-anthracite-light" />
      </div>
      <pre className="max-h-[560px] overflow-auto p-3 text-xs leading-relaxed text-cream">
        <code>{code}</code>
      </pre>
    </div>
  );
}
