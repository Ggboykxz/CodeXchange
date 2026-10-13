/**
 * Thème (clair / sombre / auto).
 *
 * `auto` = suit l'OS (défaut) ; `light` / `dark` forcent le choix de
 * l'utilisateur, persisté dans le cookie `cx_theme` (1 an). La valeur est
 * écrite sur `<html data-theme="…">` avant hydratation pour éviter tout
 * flash de thème.
 */

export type Theme = "light" | "dark" | "auto";

export const THEMES: Theme[] = ["light", "dark", "auto"];

export function estTheme(valeur: string | undefined): valeur is Theme {
  return valeur === "light" || valeur === "dark" || valeur === "auto";
}

const COOKIE_THEME = "cx_theme";

/** Résout le thème effectif : `auto` suit `prefers-color-scheme`. */
export function themeEffectif(theme: Theme): "light" | "dark" {
  if (theme !== "auto") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applique le thème sur `<html>` (usage client). */
export function appliquerTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.cookie = `${COOKIE_THEME}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

/** Lit le thème courant depuis le cookie (usage client). */
export function cookieTheme(): Theme {
  if (typeof document === "undefined") return "auto";
  const match = /(?:^|;\s*)cx_theme=(light|dark|auto)/.exec(document.cookie);
  return match && estTheme(match[1]) ? match[1] : "auto";
}

/**
 * Lit le thème courant côté serveur (composants serveur).
 * Retombe sur `auto` hors contexte de requête (tests, rendu statique).
 */
export async function themeCourant(): Promise<Theme> {
  try {
    const { cookies } = await import("next/headers");
    const valeur = (await cookies()).get("cx_theme")?.value;
    return estTheme(valeur) ? valeur : "auto";
  } catch {
    return "auto";
  }
}
