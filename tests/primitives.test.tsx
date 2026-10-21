// Tests de comportement des primitives interactives (Lot D) :
// menu (Base UI), dialogues de confirmation, fermeture clavier.
// Environnement DOM : jsdom (les autres tests restent en `node`).
// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import BoutonMenuNav from "@/components/bouton-menu-nav";
import MenuUtilisateur from "@/components/menu-utilisateur";
import PanneauNav from "@/components/panneau-nav";
import RechercheDropdown from "@/components/recherche-dropdown";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NavProvider } from "@/components/nav-context";
import { t } from "@/lib/i18n";

const MEMBRE = { nom: "Awa Diallo", slug: "awa", avatar: null };

function rendreMenu() {
  return render(
    <MenuUtilisateur
      locale="fr"
      nonLues={2}
      nonLusMessages={1}
      estAdmin={false}
      membre={MEMBRE}
    />,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("primitives — menu", () => {
  test("ArrowDown ouvre le menu et place le focus sur le premier item, les flèches naviguent", async () => {
    const user = userEvent.setup();
    rendreMenu();
    const bouton = screen.getByRole("button", { name: t("fr", "profile.title") });
    bouton.focus();

    await user.keyboard("{ArrowDown}");

    const items = await screen.findAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(items[1]);

    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(items[0]);
  });

  test("après une action le menu se ferme et le focus revient au déclencheur", async () => {
    const user = userEvent.setup();
    rendreMenu();
    const bouton = screen.getByRole("button", { name: t("fr", "profile.title") });

    await user.click(bouton);
    const deconnexion = await screen.findByRole("menuitem", { name: t("fr", "nav.logout") });
    await user.click(deconnexion);

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(bouton);
  });

  test("Échap ferme le menu et rend le focus au déclencheur", async () => {
    const user = userEvent.setup();
    rendreMenu();
    const bouton = screen.getByRole("button", { name: t("fr", "profile.title") });

    await user.click(bouton);
    expect(await screen.findByRole("menu")).toBeTruthy();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(bouton);
  });
});

describe("primitives — popover de recherche", () => {
  test("le focus entre dans le champ, Échap ferme et le rend à l'icône", async () => {
    const user = userEvent.setup();
    render(<RechercheDropdown locale="fr" suggestions={["react", "postgres"]} />);

    const declencheur = screen.getByRole("button", { name: t("fr", "nav.search") });
    await user.click(declencheur);

    const champ = await screen.findByRole("searchbox");
    await waitFor(() => expect(document.activeElement).toBe(champ));

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("searchbox")).toBeNull());
    expect(document.activeElement).toBe(declencheur);
  });
});

describe("primitives — drawer mobile", () => {
  /** Viewport mobile simulé : `max-width` → vrai, le reste → faux. */
  function simulerMobile() {
    vi.stubGlobal("matchMedia", (requete: string) => ({
      matches: requete.includes("max-width"),
      media: requete,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }));
  }

  function rendreDrawer() {
    return render(
      <NavProvider>
        <BoutonMenuNav libelle="Ouvrir le menu" />
        <main id="main">Contenu</main>
        <PanneauNav locale="fr" theme="light" communautes={[]} connecte={false} />
      </NavProvider>,
    );
  }

  test("au chargement, le ☰ ne vole pas le focus", async () => {
    simulerMobile();
    rendreDrawer();
    const bouton = screen.getByRole("button", { name: "Ouvrir le menu" });
    await waitFor(() => expect(document.activeElement).not.toBe(bouton));
    expect(document.activeElement).toBe(document.body);
  });

  test("ouverture : focus dans le panneau + contenu en inert ; fermeture : focus rendu au ☰", async () => {
    simulerMobile();
    const user = userEvent.setup();
    rendreDrawer();
    const bouton = screen.getByRole("button", { name: "Ouvrir le menu" });

    await user.click(bouton);
    const aside = document.getElementById("navigation-laterale");
    expect(aside).not.toBeNull();
    await waitFor(() => expect(aside?.contains(document.activeElement)).toBe(true));
    expect(document.getElementById("main")?.hasAttribute("inert")).toBe(true);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(bouton));
    expect(document.getElementById("main")?.hasAttribute("inert")).toBe(false);
  });
});

describe("primitives — dialogue de confirmation", () => {
  test("rôle alertdialog, titre et description liés, focus initial sur Annuler", async () => {
    const confirmer = vi.fn();
    const annuler = vi.fn();
    render(
      <ConfirmDialog
        open
        titre="Supprimer la réponse ?"
        description="Cette action est définitive."
        confirmer={confirmer}
        annuler={annuler}
      />,
    );

    const dialogue = await screen.findByRole("alertdialog");
    const idTitre = dialogue.getAttribute("aria-labelledby");
    const idDescription = dialogue.getAttribute("aria-describedby");
    expect(idTitre).toBeTruthy();
    expect(idDescription).toBeTruthy();
    expect(document.getElementById(idTitre as string)?.textContent).toBe(
      "Supprimer la réponse ?",
    );
    expect(document.getElementById(idDescription as string)?.textContent).toBe(
      "Cette action est définitive.",
    );

    const boutonAnnuler = screen.getByRole("button", { name: "Annuler" });
    await waitFor(() => expect(document.activeElement).toBe(boutonAnnuler));
  });

  test("deux dialogues ouverts ont des ids distincts (pas de collision)", async () => {
    render(
      <>
        <ConfirmDialog open titre="Titre A" description="Desc A" confirmer={vi.fn()} annuler={vi.fn()} />
        <ConfirmDialog open titre="Titre B" description="Desc B" confirmer={vi.fn()} annuler={vi.fn()} />
      </>,
    );

    // Requête DOM directe : Base UI neutralise (aria-hidden) le dialogue non
    // actif, ce qui le retire de l'arbre d'accessibilité — c'est justement le
    // comportement voulu pour deux modales superposées.
    await waitFor(() => {
      expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(2);
    });
    const dialogues = Array.from(document.querySelectorAll('[role="alertdialog"]'));
    const ids = dialogues.map((d) => d.getAttribute("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
    for (const dialogue of dialogues) {
      const id = dialogue.getAttribute("aria-labelledby") as string;
      expect(document.getElementById(id)?.textContent).toMatch(/^Titre [AB]$/);
    }
  });

  test("Échap annule et le focus reste piégé dans le dialogue", async () => {
    const annuler = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        titre="Confirmer ?"
        description="Description"
        confirmer={vi.fn()}
        annuler={annuler}
      />,
    );

    const dialogue = await screen.findByRole("alertdialog");
    await user.tab();
    await user.tab();
    // Base UI déplace le focus via ses gardes de focus : la redirection vers le
    // premier élément tabbable est asynchrone, d'où l'attente.
    await waitFor(() => expect(dialogue.contains(document.activeElement)).toBe(true));

    await user.keyboard("{Escape}");
    expect(annuler).toHaveBeenCalledTimes(1);
  });

  test("le clic sur le bouton destructif appelle confirmer sans fermer tout seul", async () => {
    const confirmer = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        titre="Confirmer ?"
        confirmer={confirmer}
        annuler={vi.fn()}
        labelConfirmer="Supprimer"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));
    expect(confirmer).toHaveBeenCalledTimes(1);
  });
});
