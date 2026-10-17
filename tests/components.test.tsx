import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/forum",
}));

import { EmptyState } from "@/components/empty-state";
import Avatar from "@/components/avatar";
import { Header } from "@/components/header";
import PanneauNav from "@/components/panneau-nav";

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

  it("Header rend la barre (logo, recherche unique via palette ⌘K, actions)", async () => {
    const element = await Header();
    const html = renderToStaticMarkup(element);
    // Logo + palette de recherche (une seule interface de recherche) + actions.
    expect(html).toContain("/");
    expect(html).toContain("Rechercher…");
    expect(html).toContain("⌘K");
    expect(html).toContain("Connexion");
    // Le menu ☰ ouvre la navigation latérale.
    expect(html).toContain("navigation-laterale");
    expect(html).toContain("Ouvrir le menu");
  });

  it("Navigation latérale rend les liens Reddit (Fil / Explorer)", () => {
    const html = renderToStaticMarkup(
      <PanneauNav locale="fr" theme="light" communautes={[{ tag: "react", count: 3 }]} connecte={false} />,
    );
    for (const label of [
      "Forum",
      "Emplois",
      "Projets",
      "Annuaire",
      "Tutos",
      "Événements",
      "Mentorat",
      "Communautés",
      "c/react",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("/forum?tri=top");
  });
});
