"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import type { Locale } from "@/i18n/dictionaries";

/**
 * WCAG 3.1.1 « Langue de la page » : `<html lang>` doit décrire la langue
 * *réellement servie*, et non la locale sélectionnée dans le menu.
 *
 * `sw` et `ar` héritent encore du dictionnaire anglais (`src/i18n/dictionaries.ts`
 * : `const sw = { ...en }`), donc annoncer `lang="sw"` mentirait au lecteur
 * d'écran. On déclare la langue du contenu et on basculera sur `sw`/`ar`
 * le jour où leurs clés seront traduites — avec, pour l'arabe, `dir="rtl"`
 * (le layout actuel repose encore sur des propriétés physiques `pl-/pr-/left`,
 * activer le RTL maintenant casserait la mise en page).
 *
 * Composant séparé de `layout.tsx` (serveur) : `<html lang>` est rendu côté
 * serveur en `fr`, la synchronisation se fait à la montée du client, donc
 * aucun décalage d'hydratation.
 */
const CONTENT_LANG: Record<Locale, string> = {
  fr: "fr",
  en: "en",
  sw: "en", // TODO: "sw" quand les clés swahili seront fournies
  ar: "en", // TODO: "ar" + dir="rtl" quand les clés arabes seront fournies
};

/** Libellé du lien d'évitement, mémorisé côté serveur en français (défaut). */
const SKIP_LABEL: Record<Locale, string> = {
  fr: "Aller au contenu principal",
  en: "Skip to main content",
  sw: "Skip to main content",
  ar: "Skip to main content",
};

export function LocaleSync() {
  const locale = useAppStore((s) => s.locale);

  useEffect(() => {
    const lang = CONTENT_LANG[locale] ?? "fr";
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
    // Sens d'écriture dérivé de la langue de contenu.
    const dir = lang === "ar" ? "rtl" : "ltr";
    if (document.documentElement.dir !== dir) {
      document.documentElement.dir = dir;
    }
    // Le lien d'évitement est rendu côté serveur en FR : on réaligne son
    // libellé de façon impérative pour éviter un décalage d'hydratation.
    const skip = document.getElementById("skip-link");
    const label = SKIP_LABEL[locale] ?? SKIP_LABEL.fr;
    if (skip && skip.textContent !== label) {
      skip.textContent = label;
    }
  }, [locale]);

  return null;
}
