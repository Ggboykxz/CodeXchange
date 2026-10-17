"use client";

import { useMemo } from "react";
import { useToast } from "@/components/toast";
import { IconeAnimee } from "@/components/icone-animee";

/** Mini rendu Markdown sûr (gras, italique, code inline et blocs, liens, images). */

function BlocCodeCopiable({ code }: { code: string }) {
  const toast = useToast();
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code).then(
            () => toast.succes("Code copié"),
            () => toast.erreur("Copie impossible"),
          );
        }}
        aria-label="Copier le code"
        title="Copier le code"
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-cx-border bg-cx-card px-2 py-1 text-[11px] font-semibold text-cx-muted-fg opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 hover:text-cx-fg"
      >
        <IconeAnimee nom="copie" className="size-3" />
        Copier
      </button>
      <pre className="overflow-x-auto rounded-lg bg-cx-muted p-3 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function echap(valeur: string) {
  return valeur.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renduLigne(texte: string): string {
  const codes: string[] = [];
  let sortie = texte.replace(/`([^`\n]+)`/g, (_m, contenu: string) => {
    codes.push(contenu);
    return `\u0000${codes.length - 1}\u0000`;
  });

  // Images : valider l'URL puis neutraliser pour éviter que la règle des liens
  // ne réécrit l'URL à l'intérieur de l'attribut src.
  const images: { alt: string; url: string }[] = [];
  sortie = sortie.replace(/!\[([^\]\n]*)\]\(([^()\s]+)\)/g, (_m, alt: string, url: string) => {
    if (!estUrlDeLien(url)) return alt;
    images.push({ alt, url });
    return `\u0001${images.length - 1}\u0001`;
  });

  // Liens http(s).
  sortie = sortie.replace(/\[([^\]\n]+)\]\(([^()\s]+)\)/g, (_m, libelle: string, url: string) => {
    if (!estUrlDeLien(url)) return libelle;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-cx-primary underline break-all">${echap(libelle)}</a>`;
  });

  function estUrlDeLien(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  // #hashtag → page forum par tag ; @membre → profil.
  sortie = sortie.replace(
    /(^|[\s(])#([\p{L}\p{N}_]{2,40})/gu,
    (_m, pre: string, tag: string) => `${pre}<a href="/forum?tag=${encodeURIComponent(tag)}" class="font-semibold text-cx-primary hover:underline">#${tag}</a>`,
  );
  sortie = sortie.replace(
    /(^|[\s(])@([a-z0-9][a-z0-9-]{1,39})/gi,
    (_m, pre: string, slug: string) => `${pre}<a href="/membres/${encodeURIComponent(slug)}" class="font-semibold text-cx-primary hover:underline">@${slug}</a>`,
  );
  sortie = sortie.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  sortie = sortie.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  sortie = sortie.replace(/\u0001(\d+)\u0001/g, (_m, index: string) => {
    const image = images[Number(index)];
    if (!image) return "";
    const style = "loading=\'lazy\' class=\'my-2 w-full rounded-lg border border-cx-border\'";
    return `<img src="${image.url}" alt="${echap(image.alt)}" ${style} />`;
  });
  sortie = sortie.replace(/\u0000(\d+)\u0000/g, (_m, index: string) => {
    return `<code class="rounded bg-cx-muted px-1 py-0.5 text-xs font-mono">${echap(codes[Number(index)] ?? "")}</code>`;
  });

  return sortie;
}

export default function RenduMarkdown({ texte }: { texte: string }) {
  const blocs = useMemo(() => {
    const segments = texte.split(/```/);
    return segments.map((seg, i) => {
      if (i % 2 === 1) {
        // bloc code
        const lignes = seg.split("\n").slice(1); // drop language hint line
        const contenu = lignes.join("\n").trimEnd();
        return <BlocCodeCopiable key={i} code={contenu} />;
      }
      // texte normal avec lignes
      return (
        <div key={i} className="space-y-2">
          {seg.split(/\n\n+/).map((paragraphe, j) => {
            if (!paragraphe.trim()) return null;
            return (
              <p
                key={j}
                className="whitespace-pre-line break-words"
                dangerouslySetInnerHTML={{ __html: renduLigne(paragraphe.trim()) }}
              />
            );
          })}
        </div>
      );
    });
  }, [texte]);

  return <div className="space-y-3">{blocs}</div>;
}
