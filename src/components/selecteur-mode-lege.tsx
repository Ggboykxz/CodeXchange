"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Icone } from "@/components/icones";

const CLE = "cx-data-saver";
const EVENEMENT = "cx-data-saver-change";

/** Lit la préférence : choix explicite, sinon `prefers-reduced-data`. */
function lirePreference(): boolean {
  try {
    const valeur = localStorage.getItem(CLE);
    if (valeur === "1") return true;
    if (valeur === "0") return false;
  } catch {
    /* stockage indisponible (navigation privée) */
  }
  try {
    return window.matchMedia("(prefers-reduced-data: reduce)").matches;
  } catch {
    return false;
  }
}

function souscrire(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-data: reduce)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  window.addEventListener(EVENEMENT, callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENEMENT, callback);
  };
}

/**
 * Bascule le mode léger (économie de données) : désactive animations et
 * transitions. La préférence est lue via `useSyncExternalStore` — pas de
 * setState synchrone dans un effet, et synchronisation entre onglets.
 */
export default function SelecteurModeLege() {
  const actif = useSyncExternalStore(souscrire, lirePreference, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("data-saver", actif);
  }, [actif]);

  function basculer() {
    const prochain = !actif;
    try {
      localStorage.setItem(CLE, prochain ? "1" : "0");
    } catch {
      /* ignoré */
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={actif}
      title={actif ? "Désactiver le mode léger" : "Activer le mode léger (réseau lent)"}
      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-cx-border px-2 text-xs font-medium text-cx-muted-fg transition hover:bg-cx-muted"
    >
      <Icone nom="parametres" className="size-4" />
      <span className="sr-only">Mode léger</span>
    </button>
  );
}
