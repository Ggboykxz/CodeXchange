"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { IconeAnimee } from "@/components/icone-animee";

type Props = {
  kind: string;
  targetId: number;
  initial: boolean;
  connecte: boolean;
};

export default function BoutonFavori({ kind, targetId, initial, connecte }: Props) {
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
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        favori
          ? "border-cx-warning/60 bg-cx-warning/10 text-cx-warning"
          : "border-cx-border bg-cx-card text-cx-muted-fg hover:bg-cx-muted"
      }`}
      title={connecte ? "Ajouter/retirer des favoris" : "Se connecter pour favoriser"}
    >
      {favori ? <IconeAnimee nom="etoile" className="mr-1 inline h-3 w-3" /> : <IconeAnimee nom="etoile-vide" className="mr-1 inline h-3 w-3" />} Favori
    </button>
  );
}
