/**
 * Validateurs réutilisables (côté client et serveur).
 *
 * Règle : la même validation s'exécute en direct (retour visuel immédiat) et au
 * serveur (sécurité). Aucune confiance accordée au client.
 */

export type ErreursChamps<T extends string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validerEmail(valeur: string): string | null {
  const v = valeur.trim();
  if (!v) return "L'adresse e-mail est obligatoire.";
  if (!EMAIL_RE.test(v)) return "Cette adresse e-mail est invalide.";
  return null;
}

export function validerMotDePasse(valeur: string): string | null {
  if (!valeur) return "Le mot de passe est obligatoire.";
  if (valeur.length < 8) return "Au moins 8 caractères.";
  if (valeur.length > 72) return "72 caractères maximum.";
  if (!/[a-zA-Z]/.test(valeur) || !/[0-9]/.test(valeur)) {
    return "Mélangez lettres et chiffres.";
  }
  return null;
}

export function validerObligatoire(valeur: string, champ: string, min = 1, max = 200): string | null {
  const v = valeur.trim();
  if (!v) return `${champ} est obligatoire.`;
  if (v.length < min) return `${champ} : au moins ${min} caractères.`;
  if (v.length > max) return `${champ} : ${max} caractères maximum.`;
  return null;
}

/** Retourne la première erreur d'un lot de validateurs, sinon `null`. */
export function premiereErreur(erreurs: Array<string | null>): string | null {
  return erreurs.find((e) => e !== null) ?? null;
}
