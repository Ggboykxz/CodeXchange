"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Raccourcis globaux façon X :
 * - `/` : focus la barre de recherche ;
 * - `n` : ouvrir la composition d'un nouveau sujet.
 *
 * Les deux sont ignorés pendant une saisie, avec modificateur, ou lorsqu'une
 * surface modale/menu est ouverte — un raccourci global ne doit jamais voler
 * une frappe destinée à un composant interactif.
 */
export default function RaccourciRecherche() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        document.querySelector(
          "[role='dialog'][aria-modal='true'], [role='alertdialog'], [role='menu'], [role='listbox']",
        )
      ) {
        return;
      }

      if (e.key === "/") {
        const input = document.querySelector<HTMLInputElement>("input[data-cx-search='true']");
        if (input) {
          e.preventDefault();
          input.focus();
        }
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        router.push("/forum/nouveau");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
