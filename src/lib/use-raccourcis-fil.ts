"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Navigation clavier façon X dans un fil de sujets.
 *
 * - `j` / `k` : sujet suivant / précédent ;
 * - `Entrée` ou `o` : ouvre le sujet actif ;
 * - `Échap` : quitte la navigation (retire la mise en évidence).
 *
 * Le hook ne s'active jamais pendant une saisie (input, textarea, select,
 * contenteditable, textbox) ni quand un dialogue modal ou un menu est ouvert :
 * les raccourcis globaux ne doivent pas voler le clavier à une surface
 * interactive. Aucune touche modificatrice n'est interceptée (⌘/Ctrl/Alt).
 *
 * L'élément actif est repéré par `data-fil-item` + `data-actif="true"` ;
 * le lien principal porte `data-lien-principal`. La mise en évidence visuelle
 * et `aria-current` restent à la charge du composant consommateur.
 */
export function useRaccourcisFil(ids: number[]) {
  const [actifId, setActifId] = useState<number | null>(null);
  // Ref pour ne pas ré-abonner l'écouteur à chaque rendu du fil.
  const idsRef = useRef(ids);
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  const deplacer = useCallback((pas: number) => {
    const liste = idsRef.current;
    if (liste.length === 0) return;
    setActifId((courant) => {
      const index = courant == null ? -1 : liste.indexOf(courant);
      // Repartir du bon bout quand on arrive en butée.
      const suivant =
        index === -1
          ? pas > 0
            ? 0
            : liste.length - 1
          : Math.min(Math.max(index + pas, 0), liste.length - 1);
      return liste[suivant] ?? null;
    });
  }, []);

  useEffect(() => {
    function estSurfaceSaisie(cible: HTMLElement | null): boolean {
      if (!cible || typeof cible.closest !== "function") return false;
      return Boolean(
        cible.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox'], [role='combobox']",
        ),
      );
    }

    function surTouche(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (estSurfaceSaisie(e.target as HTMLElement | null)) return;
      // Ne pas détourner le clavier d'une surface modale ou d'un menu ouvert.
      if (
        document.querySelector(
          "[role='dialog'][aria-modal='true'], [role='alertdialog'], [role='menu'], [role='listbox']",
        )
      ) {
        return;
      }

      switch (e.key) {
        case "j":
          e.preventDefault();
          deplacer(1);
          break;
        case "k":
          e.preventDefault();
          deplacer(-1);
          break;
        case "o":
        case "Enter": {
          const lien = document.querySelector<HTMLElement>(
            "[data-fil-item][data-actif='true'] [data-lien-principal]",
          );
          if (!lien) return;
          e.preventDefault();
          lien.click();
          break;
        }
        case "Escape":
          setActifId(null);
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [deplacer]);

  // Garder l'élément actif visible sans voler le focus (pas de saut de page).
  useEffect(() => {
    if (actifId == null) return;
    const el = document.querySelector<HTMLElement>(`[data-fil-item][data-id="${actifId}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [actifId]);

  return { actifId, setActifId };
}
