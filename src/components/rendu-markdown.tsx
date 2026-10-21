"use client";

import { useMemo } from "react";
import { useToast } from "@/components/toast";
import { IconeAnimee } from "@/components/icone-animee";
import { decouperMarkdown } from "@/lib/markdown-forum";

/**
 * Rendu Markdown du forum (gras, italique, code, liens, images, citations,
 * listes, titres). Le HTML injecté provient uniquement de `@/lib/markdown-forum`,
 * qui échappe systématiquement l'entrée avant interprétation.
 */

function BlocCodeCopiable({ code, langage }: { code: string; langage: string }) {
  const toast = useToast();

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      toast.succes("Code copié");
    } catch {
      toast.erreur("Copie impossible");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cx-border bg-cx-muted">
      <div className="flex items-center justify-between gap-2 border-b border-cx-border px-3 py-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-cx-muted-fg">
          {langage || "code"}
        </span>
        <button
          type="button"
          onClick={copier}
          aria-label="Copier le code"
          title="Copier le code"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-cx-muted-fg transition-colors duration-150 hover:bg-cx-card hover:text-cx-fg"
        >
          <IconeAnimee nom="copie" className="size-3" />
          Copier
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CLASSES_TITRE: Record<number, string> = {
  3: "text-base font-semibold text-cx-fg",
  4: "text-sm font-semibold text-cx-fg",
  5: "text-xs font-semibold uppercase tracking-wide text-cx-muted-fg",
  6: "text-xs font-semibold uppercase tracking-wide text-cx-muted-fg",
};

export default function RenduMarkdown({ texte }: { texte: string }) {
  const blocs = useMemo(() => decouperMarkdown(texte), [texte]);

  return (
    <div className="space-y-3">
      {blocs.map((bloc, index) => {
        if (bloc.type === "code") {
          return <BlocCodeCopiable key={index} code={bloc.code} langage={bloc.langage} />;
        }

        if (bloc.type === "titre") {
          const Balise = `h${bloc.niveau}` as "h3" | "h4" | "h5" | "h6";
          return (
            <Balise
              key={index}
              className={CLASSES_TITRE[bloc.niveau] ?? CLASSES_TITRE[3]}
              dangerouslySetInnerHTML={{ __html: bloc.html }}
            />
          );
        }

        if (bloc.type === "citation") {
          return (
            <blockquote
              key={index}
              className="whitespace-pre-line break-words border-l-2 border-cx-primary/40 pl-3 text-cx-muted-fg"
              dangerouslySetInnerHTML={{ __html: bloc.html }}
            />
          );
        }

        if (bloc.type === "liste") {
          const Balise = bloc.ordonnee ? "ol" : "ul";
          return (
            <Balise
              key={index}
              className={
                bloc.ordonnee
                  ? "list-decimal space-y-1 pl-5 marker:text-cx-muted-fg"
                  : "list-disc space-y-1 pl-5 marker:text-cx-muted-fg"
              }
            >
              {bloc.items.map((item, rang) => (
                <li
                  key={rang}
                  className="break-words"
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))}
            </Balise>
          );
        }

        return (
          <p
            key={index}
            className="whitespace-pre-line break-words"
            dangerouslySetInnerHTML={{ __html: bloc.html }}
          />
        );
      })}
    </div>
  );
}
