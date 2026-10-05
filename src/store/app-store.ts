"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback } from "react";
import { Locale, translate } from "@/i18n/dictionaries";

type AppState = {
  locale: Locale;
  setLocale: (l: Locale) => void;

  // navigation: which section is currently shown
  section: string;
  sectionParam?: string;
  navigate: (section: string, param?: string) => void;

  // theme is handled by next-themes
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "fr",
      setLocale: (locale) => set({ locale }),

      section: "home",
      sectionParam: undefined,
      navigate: (section, sectionParam) => {
        set({ section, sectionParam });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          // Update hash for shareability
          const hash = sectionParam
            ? `#${section}/${sectionParam}`
            : section === "home"
            ? ""
            : `#${section}`;
          window.history.replaceState(null, "", `/${hash ? hash : ""}`);
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
