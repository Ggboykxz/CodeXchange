import { describe, expect, it } from "vitest";
import { authUserSelect, authorSelect, publicUserSelect } from "@/lib/selects";

/**
 * Les sélecteurs sont le point unique où l'on décide ce qui sort d'une API.
 * Le filtre `json()` en aval double la garde, mais le test bloque ici les
 * régressions du type « on ajoute `email` parce qu'il faut l'afficher » —
 * c'est ainsi qu'un `passwordHash` finit dans une réponse un jour.
 */
describe("publicUserSelect — sélecteur des profils publics", () => {
  const interdits = ["passwordHash", "email", "role", "verificationTokenHash"] as const;

  it.each(interdits)("n'expose jamais `%s`", (champ) => {
    expect(publicUserSelect).not.toHaveProperty(champ);
  });

  it("expose bien ce qui est censé être public", () => {
    expect(publicUserSelect).toHaveProperty("id");
    expect(publicUserSelect).toHaveProperty("name");
    expect(publicUserSelect).toHaveProperty("image");
    expect(publicUserSelect).toHaveProperty("reputation");
    // Le badge « profil vérifié » se base là-dessus — pas sur le jeton.
    expect(publicUserSelect).toHaveProperty("emailVerifiedAt");
    expect(publicUserSelect).toHaveProperty("profile");
  });
});

describe("authUserSelect — sélecteur de la session", () => {
  it("donne l'email et le rôle, mais pas le hash du mot de passe", () => {
    expect(authUserSelect).toHaveProperty("email");
    expect(authUserSelect).toHaveProperty("role");
    expect(authUserSelect).not.toHaveProperty("passwordHash");
    expect(authUserSelect).not.toHaveProperty("verificationTokenHash");
  });

  it("est construit sur le sélecteur public (aucun détournement de champ)", () => {
    // `authorSelect` = `publicUserSelect` : c'est cette identité qui doit
    // rester vraie, sinon les routes d'auteur repartent de leur propre copie.
    expect(authorSelect).toEqual(publicUserSelect);
    expect(authUserSelect).toMatchObject(publicUserSelect);
  });
});

describe("authorSelect — sélecteur d'auteur des contenus", () => {
  it("porte la réputation que le badge `★ n` vient lire", () => {
    // Bug corrigé : 4 routes du forum utilisaient une copie locale sans
    // `reputation` → le badge affichait 0 partout.
    expect(authorSelect).toHaveProperty("reputation");
  });

  it.each(["passwordHash", "email", "verificationTokenHash"])(
    "n'expose pas `%s`",
    (champ) => {
      expect(authorSelect).not.toHaveProperty(champ);
    }
  );
});
