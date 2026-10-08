"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/* Langages enregistrés à la main : PrismLight ne charge que ceux-ci,
   ce qui garde le bundle léger (objectif < 150 Ko gzip du cahier des charges). */
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";

import ghcolors from "react-syntax-highlighter/dist/esm/styles/prism/ghcolors";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("docker", docker);
SyntaxHighlighter.registerLanguage("dockerfile", docker);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("php", php);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);

type MarkdownProps = {
  content: string;
  className?: string;
};

/** Bouton copier du bloc de code — feedback visuel + accessibilité (aria-live). */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponible (contexte non sécurisé) : on ignore silencieusement.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Code copié" : "Copier le code"}
      className="absolute end-2 top-2 rounded border border-border bg-background/80 px-2 py-1 text-[10px] font-mono text-muted-foreground opacity-0 transition hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
    >
      {copied ? "copié ✓" : "copier"}
    </button>
  );
}

/**
 * Rendu Markdown des questions et réponses.
 *
 * - `remarkGfm` : tableaux, listes de tâches, strikethrough, liens automatiques.
 * - **Pas** de `rehype-raw` : le HTML brut des utilisateurs n'est jamais interprété,
 *   ce qui ferme la porte à l'injection de script depuis un corps de message.
 * - Coloration syntaxique via PrismLight (langages enregistrés à la main ci-dessus).
 */
export function Markdown({ content, className }: MarkdownProps) {
  const { resolvedTheme } = useTheme();
  const style = resolvedTheme === "dark" ? vscDarkPlus : ghcolors;

  const plugins = useMemo(() => [remarkGfm], []);

  return (
    <div className={cn("cx-markdown text-[15px] leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={plugins}
        components={{
          a({ href, children }) {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer nofollow" : undefined}
                className="text-chart-1 underline underline-offset-2 hover:opacity-80"
              >
                {children}
              </a>
            );
          },
          pre({ children }) {
            return <div className="relative group my-4">{children}</div>;
          },
          code({ className: lang, children, ...props }) {
            const match = /language-(\w+)/.exec(lang ?? "");
            const raw = String(children).replace(/\n$/, "");

            // Bloc de code (fourni par le plugin `language-*`).
            if (match) {
              return (
                // dir="ltr" inline : un bloc de code reste anglophone et
                // doit toujours aligner à gauche, même dans une page RTL.
                <div className="relative" dir="ltr">
                  <CopyButton code={raw} />
                  <SyntaxHighlighter
                    language={match[1]}
                    style={style as never}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                      padding: "0.875rem 1rem",
                      fontSize: "13px",
                      background: "var(--code-bg, #f6f8fa)",
                    }}
                    PreTag="div"
                  >
                    {raw}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // Code inline.
            return (
              <code
                {...props}
                dir="ltr"
                className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-foreground"
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-border bg-muted/50 px-3 py-2 text-start font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="border border-border px-3 py-2 align-top">{children}</td>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-4 border-s-2 border-chart-1 ps-4 text-muted-foreground italic">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return <h2 className="display mt-6 mb-3 text-2xl">{children}</h2>;
          },
          h2({ children }) {
            return <h3 className="display mt-5 mb-2 text-xl">{children}</h3>;
          },
          h3({ children }) {
            return <h4 className="display mt-4 mb-2 text-lg">{children}</h4>;
          },
          ul({ children }) {
            return <ul className="my-3 list-disc space-y-1 ps-6">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-3 list-decimal space-y-1 ps-6">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="my-3 first:mt-0 last:mb-0">{children}</p>;
          },
          hr() {
            return <hr className="my-6 border-border" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
