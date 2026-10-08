"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback } from "react";
import { Locale, translate } from "@/i18n/dictionaries";

/**
 * Sections rendues comme des « pages » du site. Le hash est la seule URL
 * (application d'une seule route) : il faut donc qu'il soit lisible, partageable
 * et géré par les boutons Retour/Avant du navigateur.
 */
const SECTIONS = [
  "home",
  "forum",
  "jobs",
  "projects",
  "mentorat",
  "tutos",
  "annuaire",
  "dashboard",
  // B8 — outil de gestion des rôles. Le lien de navigation n'apparaît que
  // pour un admin, mais l'ancre existe : `#admin` partageable, et un
  // non-admin qui l'ouvre voit un refus net plutôt qu'un écran vide.
  "admin",
];

/** `#forum/slug` → `{ section: "forum", param: "slug" }` ; absolu → accueil. */
function parseHash(): { section: string; param?: string } {
  if (typeof window === "undefined") return { section: "home" };
  const hash = window.location.hash.slice(1);
  if (!hash) return { section: "home" };
  const [name, param] = hash.split("/");
  if (SECTIONS.includes(name)) return { section: name, param };
  // Ancre inconnue (ancien lien, ancre HTML) : on reste sur l'accueil plutôt
  // que d'afficher un écran vide.
  return { section: "home" };
}

function hashOf(section: string, param?: string): string {
  if (section === "home") return "";
  return param ? `#${section}/${param}` : `#${section}`;
}

type AppState = {
  locale: Locale;
  setLocale: (l: Locale) => void;

  // navigation: which section is currently shown
  section: string;
  sectionParam?: string;
  /** Action utilisateur : affiche la section ET ajoute une entrée d'historique. */
  navigate: (section: string, param?: string) => void;
  /** Reflet de l'URL (clic sur un lien natif, Retour/Avant) : ne TOUCHE PAS à l'historique. */
  syncFromHash: () => void;

  // theme is handled by next-themes
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      locale: "fr",
      setLocale: (locale) => set({ locale }),

      section: "home",
      sectionParam: undefined,

      navigate: (section, sectionParam) => {
        set({ section, sectionParam });
        if (typeof window === "undefined") return;
        window.scrollTo({ top: 0, behavior: "smooth" });
        const target = window.location.pathname + hashOf(section, sectionParam);
        const current = window.location.pathname + window.location.hash;
        // `pushState` (et non plus `replaceState`) : chaque section devient une
        // entrée d'historique, donc Retour revient à l'écran précédent au lieu
        // de quitter le site.
        if (current !== target) window.history.pushState(null, "", target);
      },

      syncFromHash: () => {
        const { section, param } = parseHash();
        const state = get();
        if (state.section === section && state.sectionParam === param) return;
        set({ section, sectionParam: param });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    }),
    {
      name: "codexchange-storage",
      partialize: (s) => ({ locale: s.locale }) as AppState,
    }
  )
);

export function useT() {
  const locale = useAppStore((s) => s.locale);
  // useCallback ensures stable function identity per locale
  return useCallback(
    (key: string) => translate(locale, key),
    [locale]
  );
}
