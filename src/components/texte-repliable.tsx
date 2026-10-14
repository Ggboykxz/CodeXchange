"use client";

import { ReactNode, useState } from "react";

/** Masque les textes longs derrière un « Lire la suite » (supporte des enfants). */
export default function TexteRepliable({
  texte,
  limite = 320,
  children,
}: {
  texte?: string;
  limite?: number;
  children?: ReactNode;
}) {
  const long = !!texte && texte.length > limite;
  const [ouvert, setOuvert] = useState(false);
  if (!long) {
    if (children) return <div>{children}</div>;
    return <p className="whitespace-pre-line break-words">{texte}</p>;
  }

  return (
    <div>
      <div className={ouvert ? "" : "line-clamp-6"}>{children ?? <p className="whitespace-pre-line break-words">{texte}</p>}</div>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="mt-2 text-xs font-semibold text-cx-primary hover:underline"
      >
        {ouvert ? "Masquer" : "Lire la suite…"}
      </button>
    </div>
  );
}
