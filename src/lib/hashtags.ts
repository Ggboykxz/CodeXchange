import { prisma } from "./db";
import { createNotification } from "./notifications";

/**
 * Hashtags (#sujet) et mentions (@membre) dans le contenu libre.
 *
 * - `#tag` est extrait pour la page Tendances et re-lié à `/forum?tag=tag`.
 * - `@slug` est résolu contre les slugs des membres (identifiant public) et
 *   déclenche une notification `MENTION` (fire-and-forget, jamais bloquante).
 * - L'extraction est insensible à la casse et déduplique (ordre de 1ʳᵉ occurrence).
 */

/** Caractères autorisés dans un hashtag (lettres, chiffres, souligné). */
const RE_HASHTAG = /(^|[^\p{L}\p{N}_])#([\p{L}\p{N}_]{2,40})/gu;
/** Slug membre : alphanumérique + tirets (convention `slug` de User). */
const RE_MENTION = /(^|[\s(])@([a-z0-9][a-z0-9-]{1,39})/gi;

/** Hashtags uniques (lowercase, ordre de 1ʳᵉ occurrence) d'un texte. */
export function extraireHashtags(texte: string): string[] {
  const vus = new Set<string>();
  const sorties: string[] = [];
  for (const m of texte.matchAll(RE_HASHTAG)) {
    const tag = m[2]!.toLowerCase();
    if (!vus.has(tag)) {
      vus.add(tag);
      sorties.push(tag);
    }
  }
  return sorties;
}

/** Slugs mentionnés (lowercase, uniques) d'un texte. */
export function extraireMentions(texte: string): string[] {
  const vus = new Set<string>();
  const sorties: string[] = [];
  for (const m of texte.matchAll(RE_MENTION)) {
    const slug = m[2]!.toLowerCase();
    if (!vus.has(slug)) {
      vus.add(slug);
      sorties.push(slug);
    }
  }
  return sorties;
}

/**
 * Notifie les membres mentionnés dans `texte` (hors auteur, fire-and-forget).
 * `lien` = chemin vers le contenu (ex. `/forum/42`). Ne lève jamais : une
 * notification ratée n'interrompt pas la création du contenu.
 */
export async function notifierMentions(
  texte: string,
  auteurId: number,
  lien: string,
  contexte: string,
): Promise<void> {
  const slugs = extraireMentions(texte);
  if (slugs.length === 0) return;
  try {
    const cibles = await prisma.user.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, nom: true },
    });
    await Promise.all(
      cibles
        .filter((u) => u.id !== auteurId)
        .map((u) =>
          createNotification({
            userId: u.id,
            type: "MENTION",
            text: `Vous avez été mentionné(e) par ${contexte}.`,
            lien,
          }),
        ),
    );
  } catch {
    // volontairement ignoré (fire-and-forget)
  }
}

export type Tendance = { tag: string; count: number };

/**
 * Hashtags les plus populaires (par nombre de sujets du forum les portant).
 * Agrège le champ `tags` (CSV) des sujets, tri décroissant puis alphabétique.
 */
export async function topHashtags(limite = 12): Promise<Tendance[]> {
  const sujets = await prisma.post.findMany({ select: { tags: true } });
  const comptes = new Map<string, number>();
  for (const s of sujets) {
    for (const brut of s.tags.split(",")) {
      const tag = brut.trim().toLowerCase();
      if (!tag) continue;
      comptes.set(tag, (comptes.get(tag) ?? 0) + 1);
    }
  }
  return [...comptes.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limite);
}
