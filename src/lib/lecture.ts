/**
 * Temps de lecture estimé (moyenne : 200 mots/min). Servant à l'affichage
 * « X min de lecture » sur les tutoriels et sujets.
 */

const MOTS_PAR_MIN = 200;

/** Compte les mots d'un texte (séparateurs espaces et ponctuation). */
export function compterMots(texte: string): number {
  const nettoye = texte
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_>`~\-]/g, " ");
  return nettoye.split(/\s+/).filter(Boolean).length;
}

/** Durée de lecture en minutes (minimum 1). */
export function tempsDeLectureMin(texte: string): number {
  return Math.max(1, Math.ceil(compterMots(texte) / MOTS_PAR_MIN));
}

/** Libellé court : « 3 min ». */
export function formatDureeLecture(texte: string): string {
  return `${tempsDeLectureMin(texte)} min`;
}
