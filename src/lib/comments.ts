/**
 * Fil de commentaires — construction de l'arbre et tris.
 *
 * L'API renvoie les réponses **plates** (une seule lecture, paginée), c'est
 * ici qu'elles deviennent l'arborescence de Reddit : indentation par
 * profondeur, pliage d'une branche, tri des racines.
 *
 * Aucun accès base, aucun état : tout est rejouable dans les tests, dont
 * les cas hostiles (parent disparu, auto-référence, cycle d'ids).
 */

export type CommentLike = {
  id: string;
  parentId: string | null;
  createdAt: Date | string;
  /** Score net (↑ − ↓). */
  upvotes: number;
  isAnswer?: boolean;
};

export type CommentNode<T extends CommentLike> = T & {
  children: CommentNode<T>[];
};

export const COMMENT_SORTS = ["best", "new", "old"] as const;
export type CommentSort = (typeof COMMENT_SORTS)[number];

export function parseCommentSort(value: string | null | undefined): CommentSort {
  return (COMMENT_SORTS as readonly string[]).includes(value ?? "")
    ? (value as CommentSort)
    : "best";
}

const time = (t: { createdAt: Date | string }) => new Date(t.createdAt).getTime();

/**
 * Construit l'arbre à partir de la liste plate.
 *
 * - un parent inconnu (commentaire supprimé, pagination au-delà de la page)
 *   fait **monter** le nœud en racine plutôt que de le faire disparaître ;
 * - une auto-référence ou un cycle d'ids est neutralisé de la même façon :
 *   un client ne doit pas pouvoir rendre le rendu infini en écrivant un
 *   `parentId` tournant.
 */
export function buildCommentTree<T extends CommentLike>(posts: readonly T[]): CommentNode<T>[] {
  const byId = new Map(posts.map((p) => [p.id, p]));
  const nodes = new Map<string, CommentNode<T>>();
  for (const p of posts) nodes.set(p.id, { ...p, children: [] });

  /** Remonte-t-on déjà dans l'ascendance de `childId` ? (cycle) */
  const createsCycle = (childId: string, parentId: string): boolean => {
    const seen = new Set<string>([childId]);
    let cursor: string | null | undefined = parentId;
    while (cursor) {
      if (seen.has(cursor)) return true;
      seen.add(cursor);
      cursor = byId.get(cursor)?.parentId ?? null;
    }
    return false;
  };

  const roots: CommentNode<T>[] = [];
  for (const p of posts) {
    const node = nodes.get(p.id)!;
    const parent = p.parentId ? nodes.get(p.parentId) : undefined;
    if (!parent || parent.id === p.id || createsCycle(p.id, p.parentId!)) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }
  return roots;
}

/** Nombre de commentaires d'une branche, lui compris. */
export function countReplies<T extends CommentLike>(node: CommentNode<T>): number {
  return 1 + node.children.reduce((sum, child) => sum + countReplies(child), 0);
}

/** Les descendants directs et indirects (sans le nœud lui-même). */
export function descendantsOf<T extends CommentLike>(node: CommentNode<T>): number {
  return countReplies(node) - 1;
}

const comparators: Record<CommentSort, (a: CommentLike, b: CommentLike) => number> = {
  // « Meilleurs » : la meilleure réponse d'abord, puis le score, puis l'âge
  // (à score égal, le fil ancien et discuté passe avant le neuf).
  best: (a, b) =>
    Number(Boolean(b.isAnswer)) - Number(Boolean(a.isAnswer)) ||
    b.upvotes - a.upvotes ||
    time(a) - time(b),
  // Les deux tris chronologiques, dans un sens ou l'autre.
  new: (a, b) => time(b) - time(a),
  old: (a, b) => time(a) - time(b),
};

/** Tri récursif : chaque niveau est trié, l'arbre garde sa structure. */
export function sortCommentTree<T extends CommentLike>(
  nodes: readonly CommentNode<T>[],
  sort: CommentSort = "best"
): CommentNode<T>[] {
  const compare = comparators[sort];
  return [...nodes]
    .sort(compare)
    .map((node) => ({ ...node, children: sortCommentTree(node.children, sort) }));
}

/** Racines triées, prêtes à rendrer. */
export function prepareComments<T extends CommentLike>(
  posts: readonly T[],
  sort: CommentSort = "best"
): CommentNode<T>[] {
  return sortCommentTree(buildCommentTree(posts), sort);
}
