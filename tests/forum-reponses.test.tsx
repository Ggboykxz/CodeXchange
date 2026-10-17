import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/forum/1",
}));

import ArbreReponses from "@/app/forum/[id]/arbre-reponses";
import { ToastProvider } from "@/components/toast";

/**
 * Contrat de l'arbre de réponses : des données sérialisables uniquement
 * (`likesReponses: number[]`), jamais de fonction — voir aussi
 * tests/serialisation.test.ts (garde-fou RSC global).
 */

const auteur = (id: number, nom: string) => ({
  id,
  nom,
  slug: `membre-${id}`,
  ville: "Douala",
  pays: "Cameroun",
});

const maintenant = new Date("2026-10-10T10:00:00Z");

const reponses = [
  {
    id: 101,
    postId: 1,
    corps: "Premier niveau de réponse",
    author: auteur(1, "Kossi Aho"),
    parentId: null,
    createdAt: maintenant,
    updatedAt: maintenant,
    _count: { likes: 2 },
  },
  {
    id: 102,
    postId: 1,
    corps: "Réponse imbriquée",
    author: auteur(2, "Aïcha Ondo"),
    parentId: 101,
    createdAt: maintenant,
    updatedAt: maintenant,
    _count: { likes: 0 },
  },
];

function rendre(likesReponses: number[]) {
  return renderToStaticMarkup(
    <ToastProvider>
      <ArbreReponses
        replies={reponses}
        postId={1}
        userId={7}
        likesReponses={likesReponses}
        connecte={true}
        locale="fr"
      />
    </ToastProvider>,
  );
}

describe("ArbreReponses", () => {
  it("rend l'arbre et l'imbrication des réponses", () => {
    const html = rendre([]);
    expect(html).toContain("Premier niveau de réponse");
    expect(html).toContain("Réponse imbriquée");
    // La réponse enfant est rendue dans un bloc indenté (bordure gauche).
    expect(html).toContain("border-l-2");
  });

  it("marque uniquement la réponse aimée (état sérialisé en tableau d'ids)", () => {
    const html = rendre([102]);
    const actives = html.split("bg-cx-primary/5").length - 1;
    expect(actives).toBe(1);
    // Sans données d'état, aucune réponse n'est marquée aimée.
    const neutre = rendre([]);
    expect(neutre.includes("bg-cx-primary/5")).toBe(false);
  });
});
