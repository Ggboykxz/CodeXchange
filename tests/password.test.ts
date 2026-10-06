import { describe, expect, it } from "vitest";
import { burnPasswordTime, hashPassword, sha256, verifyPassword } from "@/lib/password";

/**
 * Politique appliquée par `registerSchema` (non testée ici : voir
 * `validate.test.ts`) et par le hash de session.
 *
 * PBKDF2 coûte ~80 ms par appel — c'est le but. La suite en appelle une
 * dizaine, soit moins d'une seconde : on ne teste pas le coût, on teste
 * le contrat (format, sélage, refus, absence d'exception).
 */
describe("hashPassword / verifyPassword", () => {
  it("stocke `sel:hash` en hex et ne contient jamais le mot de passe", async () => {
    const stored = await hashPassword("Motdepasse1");
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(stored).not.toContain("Motdepasse1");
  });

  it("valide le bon mot de passe et refuse le mauvais", async () => {
    const stored = await hashPassword("Motdepasse1");
    expect(await verifyPassword("Motdepasse1", stored)).toBe(true);
    expect(await verifyPassword("Motdepasse2", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("sélage à chaque compte : deux hash d'un même mot de passe diffèrent", async () => {
    const a = await hashPassword("Motdepasse1");
    const b = await hashPassword("Motdepasse1");
    expect(a).not.toBe(b);
    expect(a.split(":")[1]).not.toBe(b.split(":")[1]);
  });

  it("refuse un stockage malformé au lieu de lever une exception", async () => {
    // Un `passwordHash` corrompu ou absent ne doit pas planter le login :
    // la route renvoie 401, pas 500.
    expect(await verifyPassword("Motdepasse1", "")).toBe(false);
    expect(await verifyPassword("Motdepasse1", "sans-deux-points")).toBe(false);
    expect(await verifyPassword("Motdepasse1", "abcd:zzzz")).toBe(false);
    expect(await verifyPassword("Motdepasse1", "abcd:0011")).toBe(false);
  });

  it("burnPasswordTime se termine sans erreur (anti-oracle du login)", async () => {
    // Équivalent coût du hash, utilisé quand l'email n'existe pas : si
    // cette fonction levait, le login renverrait 500 au lieu de 401.
    await expect(burnPasswordTime("Motdepasse1")).resolves.toBeUndefined();
  });
});

describe("sha256", () => {
  it("produit 64 caractères hex, sensible à la casse et au contenu", () => {
    expect(sha256("codexchange")).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256("codexchange")).toBe(sha256("codexchange"));
    expect(sha256("codexchange")).not.toBe(sha256("Codexchange"));
    expect(sha256("codexchange")).not.toBe(sha256("codexchange "));
  });

  it("n'est pas une permutation : deux entrées voisines n'ont aucun lien visible", () => {
    const a = sha256("session-token-0001");
    const b = sha256("session-token-0002");
    expect(a).not.toBe(b);
    let commun = 0;
    for (let i = 0; i < a.length; i++) if (a[i] === b[i]) commun++;
    // On ne s'attend à aucune corrélation structurelle.
    expect(commun).toBeLessThan(40);
  });
});
