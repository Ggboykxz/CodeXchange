/**
 * I2 — logique pure de la messagerie privée.
 *
 * Aucun accès base ici : la normalisation de paire et les garde-fous sont
 * prouvés côté test, puis réutilisés identiques par les routes.
 */

/**
 * Paire normalisée `(a, b)` avec `a < b` lexicographiquement.
 *
 * C'est **l'unique clé** d'une conversation : sans elle, « A écrit à B » et
 * « B écrit à A » créeraient deux lignes jumelles et le fil se couperait
 * en deux. Un auto-message (même id) est rejeté — une conversation
 * « soi-même avec soi-même » n'a aucun sens.
 */
export function pairOf(me: string, them: string): [string, string] {
  if (me === them) throw new Error("self-conversation");
  return me < them ? [me, them] : [them, me];
}

/** Le membre fait-il partie de cette conversation ? (garde d'accès unique) */
export function isParticipant(
  conv: { userAId: string; userBId: string },
  userId: string
): boolean {
  return conv.userAId === userId || conv.userBId === userId;
}

/** L'autre bout du fil (garde d'accès inclus côté route). */
export function peerOf(
  conv: { userAId: string; userBId: string },
  userId: string
): string | null {
  if (conv.userAId === userId) return conv.userBId;
  if (conv.userBId === userId) return conv.userAId;
  return null;
}

/**
 * Aperçu d'un message pour la liste / la notification : **une ligne** max,
 * quoi que l'auteur ait collé (retours à la ligne, bloc de code…).
 */
export function messagePreview(body: string, max = 80): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
