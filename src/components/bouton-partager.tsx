"use client";

import { useState } from "react";
import { Icone } from "@/components/icones";

/**
 * « Partager » : copie le lien du sujet dans le presse-papier (barre d'action
 * des cartes de fil façon Reddit). Feedback visuel « Copié » puis retour.
 */
export default function BoutonPartager({ path, libelle = "Partager" }: { path: string; libelle?: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 1600);
    } catch {
      setCopie(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void partager()}
      className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-muted hover:text-cx-fg active:scale-[0.97]"
    >
      <Icone nom={copie ? "coche" : "partage"} className="size-4" />
      {copie ? "Copié !" : libelle}
    </button>
  );
}
