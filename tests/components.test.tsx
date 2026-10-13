import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { EmptyState } from "@/components/empty-state";
import Avatar from "@/components/avatar";
import { Header } from "@/components/header";

describe("composants partagés", () => {
  it("EmptyState affiche le titre et le CTA", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        titre="Aucun sujet"
        description="Soyez le premier."
        cta="Écrire le premier sujet"
        href="/forum/nouveau"
      />,
    );
    expect(html).toContain("Aucun sujet");
    expect(html).toContain("Soyez le premier.");
    expect(html).toContain("Écrire le premier sujet");
    expect(html).toContain("/forum/nouveau");
  });

  it("Avatar est déterministe pour un même slug", () => {
    const a = renderToStaticMarkup(<Avatar nom="Aïcha" slug="aicha-ondo" />);
    const b = renderToStaticMarkup(<Avatar nom="Aïcha" slug="aicha-ondo" />);
    expect(a).toBe(b);
  });

  it("Header rend les liens de navigation principaux", async () => {
    const element = await Header();
    const html = renderToStaticMarkup(element);
    for (const label of [
      "Forum",
      "Emplois",
      "Projets",
      "Annuaire",
      "Tutos",
      "Événements",
      "Mentorat",
    ]) {
      expect(html).toContain(label);
    }
  });
});
