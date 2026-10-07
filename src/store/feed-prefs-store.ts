"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Préférences d'affichage du fil, conservées **par poste** (localStorage) :
 *
 * - `saved`  : les questions gardées pour plus tard (le marque-page de Reddit) ;
 * - `hidden` : celles qu'on a retirées du fil — révocable depuis le bouton
 *   « Annuler » du toast.
 *
 * L'état vit ici et non dans la carte : le fil **filtre sa liste dessus**, ce
 * qui fait que « Annuler » réinsère la publication sans rechargement ni état
 * dupliqué dans deux composants différents.
 *
 * Hérite du même `partialize` que les autres stores : seules les données sont
 * persistées, jamais les fonctions (JSON.stringify les perdrait).
 */
type FeedPrefsState = {
  saved: string[];
  hidden: string[];
  toggleSave: (id: string) => void;
  hide: (id: string) => void;
  restore: (id: string) => void;
  /** « Tout réafficher » — utilisé quand le fil est entièrement masqué. */
  restoreAll: () => void;
};

export const useFeedPrefsStore = create<FeedPrefsState>()(
  persist(
    (set) => ({
      saved: [],
      hidden: [],
      toggleSave: (id) =>
        set((s) => ({
          saved: s.saved.includes(id)
            ? s.saved.filter((x) => x !== id)
            : [...s.saved, id],
        })),
      hide: (id) =>
        set((s) => (s.hidden.includes(id) ? s : { hidden: [...s.hidden, id] })),
      restore: (id) =>
        set((s) => ({ hidden: s.hidden.filter((x) => x !== id) })),
      restoreAll: () => set({ hidden: [] }),
    }),
    {
      name: "codexchange-feed-prefs",
      partialize: (s) => ({ saved: s.saved, hidden: s.hidden }) as FeedPrefsState,
    }
  )
);
