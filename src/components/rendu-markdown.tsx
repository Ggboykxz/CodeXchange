"use client";

import { useMemo } from "react";
import { useToast } from "@/components/toast";
import { IconeAnimee } from "@/components/icone-animee";
import { decouperMarkdown, type BlocMarkdown, type NoeudEnLigne } from "@/lib/markdown-forum";

/**
 * Rendu Markdown du forum (gras, italique, code, liens, images, citations,
 * listes, titres). Le rendu utilise des éléments React natifs — pas de
 * `dangerouslySetInnerHTML`. L'AST provient de `@/lib/markdown-forum` qui
 * échappe systématiquement l'entrée avant interprétation.
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

function renduNoeudsEnLigne(noeuds: NoeudEnLigne[]): React.ReactNode {
  return noeuds.map((noeud, index) => {
    switch (noeud.type) {
      case "texte":
        return <span key={index}>{noeud.contenu}</span>;
      case "code":
        return (
          <code
            key={index}
            className="rounded bg-cx-muted px-1 py-0.5 font-mono text-xs"
          >
            {noeud.contenu}
          </code>
        );
      case "lien":
        return (
          <a
            key={index}
            href={noeud.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cx-primary underline break-all"
          >
            {noeud.libelle}
          </a>
        );
      case "image":
        return (
          <img
            key={index}
            src={noeud.url}
            alt={noeud.alt}
            loading="lazy"
            className="my-2 max-h-[480px] w-full rounded-2xl border border-cx-border object-cover"
          />
        );
      case "hashtag":
        return (
          <a
            key={index}
            href={`/forum?tag=${encodeURIComponent(noeud.tag)}`}
            className="font-semibold text-cx-primary hover:underline"
          >
            #{noeud.tag}
          </a>
        );
      case "mention":
        return (
          <a
            key={index}
            href={`/membres/${encodeURIComponent(noeud.slug)}`}
            className="font-semibold text-cx-primary hover:underline"
          >
            @{noeud.slug}
          </a>
        );
      case "gras":
        return <strong key={index}>{noeud.contenu}</strong>;
      case "italique":
        return <em key={index}>{noeud.contenu}</em>;
      default:
        return null;
    }
  });
}

function renduBloc(bloc: BlocMarkdown, index: number): React.ReactNode {
  if (bloc.type === "code") {
    return <BlocCodeCopiable key={index} code={bloc.code} langage={bloc.langage} />;
  }

  if (bloc.type === "titre") {
    const Balise = `h${bloc.niveau}` as "h3" | "h4" | "h5" | "h6";
    return (
      <Balise
        key={index}
        className={CLASSES_TITRE[bloc.niveau] ?? CLASSES_TITRE[3]}
      >
        {renduNoeudsEnLigne(bloc.enfants)}
      </Balise>
    );
  }

  if (bloc.type === "citation") {
    return (
      <blockquote
        key={index}
        className="whitespace-pre-line break-words border-l-2 border-cx-primary/40 pl-3 text-cx-muted-fg"
      >
        {renduNoeudsEnLigne(bloc.enfants)}
      </blockquote>
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
          <li key={rang} className="break-words">
            {renduNoeudsEnLigne(item)}
          </li>
        ))}
      </Balise>
    );
  }

  // paragraphe
  return (
    <p key={index} className="whitespace-pre-line break-words">
      {renduNoeudsEnLigne(bloc.enfants)}
    </p>
  );
}

export default function RenduMarkdown({ texte }: { texte: string }) {
  const blocs = useMemo(() => decouperMarkdown(texte), [texte]);

  return (
    <div className="space-y-3">
      {blocs.map((bloc, index) => renduBloc(bloc, index))}
    </div>
  );
}