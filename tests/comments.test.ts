import { describe, expect, it } from "vitest";
import {
  buildCommentTree,
  countReplies,
  descendantsOf,
  parseCommentSort,
  prepareComments,
  type CommentLike,
} from "@/lib/comments";

const T0 = new Date("2026-10-01T10:00:00.000Z").toISOString();

/** Commentaire compact : id, parent, score, heure, meilleure réponse. */
const c = (
  id: string,
  parentId: string | null = null,
  upvotes = 0,
  minutesAgo = 0,
  isAnswer = false
): CommentLike => ({
  id,
  parentId,
  upvotes,
  isAnswer,
  // `minutesAgo` est bien un RETRAIT : « vieille » doit être plus ancienne.
  createdAt: new Date(new Date(T0).getTime() - minutesAgo * 60_000).toISOString(),
});

const ids = (nodes: { id: string; children: { id: string }[] }[]): string[] =>
  nodes.map((n) => n.id);

/* ------------------------------------------------------------------ */
/* Arbre                                                               */
/* ------------------------------------------------------------------ */

describe("buildCommentTree", () => {
  it("devient une liste plate quand tout est en racine", () => {
    const tree = buildCommentTree([c("a"), c("b"), c("c")]);
    expect(ids(tree)).toEqual(["a", "b", "c"]);
    expect(tree.every((n) => n.children.length === 0)).toBe(true);
  });

  it("empile les réponses sous leur parent, sur plusieurs niveaux", () => {
    const tree = buildCommentTree([c("a"), c("b", "a"), c("c", "b"), c("d", "b")]);
    expect(ids(tree)).toEqual(["a"]);
    expect(ids(tree[0]!.children)).toEqual(["b"]);
    // « c » et « d » répondaient à « b » : même niveau, même parent.
    expect(ids(tree[0]!.children[0]!.children)).toEqual(["c", "d"]);
  });

  it("conserve l'ordre de la liste d'entrée", () => {
    const tree = buildCommentTree([c("z"), c("y"), c("x")]);
    expect(ids(tree)).toEqual(["z", "y", "x"]);
  });

  it("un parent inconnu remonte en racine (jamais de commentaire perdu)", () => {
    const tree = buildCommentTree([c("orphan", "id-qui-nexiste-pas")]);
    expect(ids(tree)).toEqual(["orphan"]);
    expect(tree[0]!.children).toEqual([]);
  });

  it("une auto-référence devient une racine", () => {
    const tree = buildCommentTree([c("self", "self")]);
    expect(ids(tree)).toEqual(["self"]);
  });

  it("un cycle d'ids ne boucle pas : les deux nœuds deviennent racines", () => {
    const tree = buildCommentTree([c("a", "b"), c("b", "a")]);
    expect(ids(tree).sort()).toEqual(["a", "b"]);
    // Aucun enfant : sinon le rendu tournerait à l'infini.
    expect(tree.every((n) => n.children.length === 0)).toBe(true);
  });

  it("accepte une liste vide", () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it("ne mutate pas l'entrée", () => {
    const input = [c("a"), c("b", "a")];
    buildCommentTree(input);
    expect(input).toHaveLength(2);
    expect((input[0] as unknown as { children?: unknown }).children).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Compteurs                                                            */
/* ------------------------------------------------------------------ */

describe("countReplies / descendantsOf", () => {
  it("compte la branche entière, le nœud compris", () => {
    const tree = buildCommentTree([c("a"), c("b", "a"), c("c", "b"), c("d")]);
    expect(countReplies(tree[0]!)).toBe(3);
    expect(descendantsOf(tree[0]!)).toBe(2);
    expect(countReplies(tree[1]!)).toBe(1);
    expect(descendantsOf(tree[1]!)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Tri                                                                  */
/* ------------------------------------------------------------------ */

describe("prepareComments", () => {
  const posts = [
    c("vieille", null, 2, 60),
    c("récente", null, 9, 0),
    c("meilleure", null, 5, 30, true),
    c("enfant", "récente", 40, 0),
  ];

  it("best : la meilleure réponse en tête, puis le score", () => {
    expect(ids(prepareComments(posts, "best"))).toEqual(["meilleure", "récente", "vieille"]);
  });

  it("new : de la plus récente à la plus ancienne", () => {
    expect(ids(prepareComments(posts, "new"))).toEqual(["récente", "meilleure", "vieille"]);
  });

  it("old : chrono, pour lire un fil dans l'ordre", () => {
    expect(ids(prepareComments(posts, "old"))).toEqual(["vieille", "meilleure", "récente"]);
  });

  it("trie aussi à l'intérieur des branches", () => {
    const nested = [c("root"), c("bas", "root", 1, 5), c("haut", "root", 8, 5)];
    const [first] = prepareComments(nested, "best");
    expect(ids(first!.children)).toEqual(["haut", "bas"]);
  });

  it("tri par défaut = « meilleurs »", () => {
    expect(ids(prepareComments(posts))).toEqual(ids(prepareComments(posts, "best")));
  });

  it("garde la structure de l'arbre après tri", () => {
    const sorted = prepareComments(posts, "old");
    expect(ids(sorted)).toEqual(["vieille", "meilleure", "récente"]);
    expect(sorted[0]!.children).toEqual([]);

    // La racine « récente » a gardé son enfant après le tri « best ».
    const withChild = prepareComments(posts, "best").find((n) => n.id === "récente");
    expect(ids(withChild!.children)).toEqual(["enfant"]);
  });
});

describe("parseCommentSort", () => {
  it.each(["best", "new", "old"])("accepte %s", (s) => expect(parseCommentSort(s)).toBe(s));
  it.each([null, "", "controversial", "BEST"])(
    "inconnu → best (%s)",
    (s) => expect(parseCommentSort(s)).toBe("best")
  );
});
