"use client";

import { useState } from "react";
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
      className="rounded-lg border border-cx-border bg-cx-card px-3 py-1.5 text-xs font-medium text-cx-muted-fg hover:bg-cx-muted"
    >
      {copie ? "✓ Copié" : libelle ?? "Copier le lien"}
    </button>
  );
}
