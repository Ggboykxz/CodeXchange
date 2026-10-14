/** Sauvegarde locale d'un brouillon de formulaire (clé par page). */

export function lireBrouillon<T>(cle: string): T | null {
  try {
    const brut = window.localStorage.getItem(`cx_draft:${cle}`);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function ecrireBrouillon<T>(cle: string, valeur: T) {
  try {
    window.localStorage.setItem(`cx_draft:${cle}`, JSON.stringify(valeur));
  } catch {
    // Silencieux (navigation privée, quota).
  }
}

export function effacerBrouillon(cle: string) {
  try {
    window.localStorage.removeItem(`cx_draft:${cle}`);
  } catch {
    // Silencieux.
  }
}
