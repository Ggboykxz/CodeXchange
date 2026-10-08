"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import type { Locale } from "@/i18n/dictionaries";

/**
 * WCAG 3.1.1 « Langue de la page » : `<html lang>` décrit la langue réelle
 * servie, et non la sélection du menu.
 *
 * Depuis D2, les clés `sw` et `ar` sont traduites, donc on annonce honnêtement
 * `lang="sw"` / `lang="ar"`. Pour l'arabe on active aussi `dir="rtl"` :
 * l'alignement des paragraphes et les flex suivent le sens d'écriture.
 * Les classes du layout sont passées en propriétés logiques (`ps-/pe-/ms-/me-/
 * start-/end-`, `text-start`) à la migration D3 — elles se retournent donc
 * d'elles-mêmes quand `dir` bascule. Les animations de panneaux Radix
 * (`slide-in-from-*`) et le côté ancré du tiroir restent physiques : un
 * contenu positionné à droite est déjà conforme à la convention RTL.)
 *
 * Composant séparé de `layout.tsx` (serveur) : `<html lang>` est rendu côté
 * serveur en `fr`, la synchronisation se fait à la montée du client, donc
 * aucun décalage d'hydratation.
 */
const CONTENT_LANG: Record<Locale, string> = {
  fr: "fr",
  en: "en",
  sw: "sw",
  ar: "ar",
};

/** Libellé du lien d'évitement, mémorisé côté serveur en français (défaut). */
const SKIP_LABEL: Record<Locale, string> = {
  fr: "Aller au contenu principal",
  en: "Skip to main content",
  sw: "Ruka hadi kwenye maudhui makuu",
  ar: "تخطَّ إلى المحتوى الرئيسي",
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
