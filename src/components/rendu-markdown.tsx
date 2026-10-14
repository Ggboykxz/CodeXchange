"use client";

import { useMemo } from "react";

/** Mini rendu Markdown sûr (gras, italique, code inline et blocs, liens). */

function echap(valeur: string) {
  return valeur.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renduLigne(texte: string): string {
  const code = texte.replace(/`([^`]+)`/g, (_m, code) => `<code class="rounded bg-cx-muted px-1 py-0.5 text-xs font-mono">${echap(code)}</code>`);
  // liens http(s)
  const avecLiens = code.replace(/(https?:\/\/[^\s)]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-cx-primary underline break-all">${url}</a>`);
  // #hashtag → page forum par tag ; @membre → profil. Frontière de mot pour
  // éviter de rattraper un "#" ou "@" au milieu d'une URL déjà transformée.
  const avecTags = avecLiens.replace(
    /(^|[\s(])#([\p{L}\p{N}_]{2,40})/gu,
    (_m, pre, tag) => `${pre}<a href="/forum?tag=${encodeURIComponent(tag)}" class="font-semibold text-cx-primary hover:underline">#${tag}</a>`,
  );
  const avecMentions = avecTags.replace(
    /(^|[\s(])@([a-z0-9][a-z0-9-]{1,39})/gi,
    (_m, pre, slug) => `${pre}<a href="/membres/${encodeURIComponent(slug)}" class="font-semibold text-cx-primary hover:underline">@${slug}</a>`,
  );
  const gras = avecMentions.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const ital = gras.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return ital;
}

export default function RenduMarkdown({ texte }: { texte: string }) {
  const blocs = useMemo(() => {
    const segments = texte.split(/```/);
    return segments.map((seg, i) => {
      if (i % 2 === 1) {
        // bloc code
        const lignes = seg.split("\n").slice(1); // drop language hint line
        const contenu = lignes.join("\n").trimEnd();
        return (
          <pre key={i} className="overflow-x-auto rounded-lg bg-cx-muted p-3 text-xs">
            <code>{contenu}</code>
          </pre>
        );
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
