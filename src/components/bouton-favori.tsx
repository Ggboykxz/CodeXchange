"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { IconeAnimee } from "@/components/icone-animee";
import { cn } from "@/lib/cn";

type Props = {
  kind: string;
  targetId: number;
  initial: boolean;
  connecte: boolean;
  /** `action` = étoile seule façon X (barre d'actions du détail). */
  variante?: "encadre" | "action";
};

export default function BoutonFavori({ kind, targetId, initial, connecte, variante = "encadre" }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [favori, setFavori] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function basculer() {
    if (!connecte) {
      router.push("/connexion");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/favoris/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, targetId }),
      });
      const data = await r.json();
      if (typeof data.favori === "boolean") setFavori(data.favori);
      if (data.favori === true) toast.succes("Ajouté aux favoris");
      else if (data.favori === false) toast.succes("Retiré des favoris");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={busy}
      aria-pressed={favori}
      className={cn(
        variante === "action"
          ? "inline-flex min-h-[33px] cursor-pointer items-center rounded-full px-2.5 py-1.5 text-xs font-semibold transition active:scale-[0.97] disabled:opacity-60"
          : "inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        variante === "action"
          ? favori
            ? "text-cx-warning hover:bg-cx-warning/10"
            : "text-cx-muted-fg hover:bg-cx-warning/10 hover:text-cx-warning"
          : favori
            ? "border-cx-warning/60 bg-cx-warning/5 text-cx-warning"
            : "border-cx-border bg-cx-card text-cx-muted-fg hover:bg-cx-muted",
      )}
      title={connecte ? "Ajouter/retirer des favoris" : "Se connecter pour favoriser"}
    >
      {favori ? <IconeAnimee nom="etoile" className="inline size-4" /> : <IconeAnimee nom="etoile-vide" className="inline size-4" />}
      {variante === "encadre" ? " Favori" : null}
    </button>
  );
}
