"use client";

import { useEffect, useState } from "react";
import { Icone } from "@/components/icones";

/** Bascule le mode léger (économie de données) : désactive animations/transitions. */
export default function SelecteurModeLege() {
  const [actif, setActif] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const v = localStorage.getItem("cx-data-saver");
    const reduce = window.matchMedia("(prefers-reduced-data: reduce)").matches;
    return v === "1" || (v === null && reduce);
  });

  useEffect(() => {
    if (actif) document.documentElement.classList.add("data-saver");
    else document.documentElement.classList.remove("data-saver");
  }, [actif]);

  function basculer() {
    const prochain = !actif;
    setActif(prochain);
    try {
      localStorage.setItem("cx-data-saver", prochain ? "1" : "0");
    } catch {
      /* ignoré */
    }
    if (prochain) document.documentElement.classList.add("data-saver");
    else document.documentElement.classList.remove("data-saver");
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={actif}
      title={actif ? "Désactiver le mode léger" : "Activer le mode léger (réseau lent)"}
      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-cx-border px-2 text-xs font-medium text-cx-muted-fg transition hover:bg-cx-muted"
    >
      <Icone nom="parametres" className="size-4" />
      <span className="sr-only">Mode léger</span>
    </button>
  );
}
