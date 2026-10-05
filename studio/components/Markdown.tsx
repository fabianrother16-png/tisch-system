"use client";

import { Children, isValidElement, memo, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./blocks/CodeBlock";
import { CsvBlock } from "./blocks/CsvBlock";
import { HiggsfieldBlock } from "./blocks/HiggsfieldBlock";
import { HtmlPreview } from "./blocks/HtmlPreview";

function codeInfo(children: ReactNode) {
  const child = Children.toArray(children)[0];
  if (!isValidElement(child)) return null;
  const props = (child as ReactElement<{ className?: string; children?: ReactNode }>).props;
  const lang = props.className?.match(/language-([\w-]+)/)?.[1]?.toLowerCase() ?? "";
  const code = String(Children.toArray(props.children).join("")).replace(/\n$/, "");
  return { lang, code };
}

function makeComponents(streaming: boolean, filenameBase: string): Components {
  return {
    pre({ children }) {
      const info = codeInfo(children);
      if (!info) return <pre>{children}</pre>;
      // Während des Streamings nur Code zeigen – Vorschauen erst, wenn der Block vollständig ist.
      if (!streaming) {
        if (info.lang === "html") return <HtmlPreview html={info.code} filename={`${filenameBase}.html`} />;
        if (info.lang === "higgsfield") return <HiggsfieldBlock json={info.code} />;
        if (info.lang === "csv") return <CsvBlock csv={info.code} filename={`${filenameBase}.csv`} />;
      }
      return <CodeBlock code={info.code} lang={info.lang} />;
    },
    table({ children }) {
      return (
        <div className="not-prose my-4 overflow-x-auto rounded-xl border border-cream-darker">
          <table className="w-full border-collapse text-sm [&_td]:border-t [&_td]:border-cream-dark [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-cream-dark/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold">
            {children}
          </table>
        </div>
      );
    },
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  };
}

export const Markdown = memo(function Markdown({
  content,
  streaming = false,
  filenameBase = "ergebnis",
}: {
  content: string;
  streaming?: boolean;
  filenameBase?: string;
}) {
  return (
    <div className="studio-prose prose prose-sm max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-h1:text-2xl prose-h2:mt-8 prose-h2:text-xl prose-h3:text-base prose-a:text-terracotta-dark prose-strong:text-anthracite prose-blockquote:border-terracotta/40 prose-code:rounded prose-code:bg-cream-dark prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none md:prose-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(streaming, filenameBase)}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
