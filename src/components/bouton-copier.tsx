"use client";

import { useState } from "react";
import { IconeAnimee } from "./icone-animee";
import { useToast } from "./toast";

/** Bouton copier un lien dans le presse-papiers (avec feedback toast). */
export default function BoutonCopier({ url, libelle }: { url: string; libelle?: string }) {
  const toast = useToast();
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      const absolu = url.startsWith("http") ? url : `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(absolu);
      setCopie(true);
      toast.succes("Lien copié");
      setTimeout(() => setCopie(false), 2000);
    } catch {
      toast.erreur("Copie impossible");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copier()}
      className="inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border border-cx-border bg-cx-card px-3 py-1.5 text-xs font-medium text-cx-muted-fg transition hover:bg-cx-muted active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {copie ? (<><IconeAnimee nom="coche" className="mr-1 inline size-3" />Copié</>) : (libelle ?? "Copier le lien")}
    </button>
  );
}
