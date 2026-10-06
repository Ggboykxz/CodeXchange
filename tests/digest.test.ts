import { describe, expect, it } from "vitest";
import { sessionDigest, verificationDigest } from "@/lib/digest";

/**
 * `digest.ts` est le cœur du « tourner `SESSION_SECRET` révoque tout » :
 * les routes de session ET de vérification passent par ces deux fonctions,
 * et c'est la cohérence entre le hachage à l'écriture et à la lecture qui
 * fait tenir le mécanisme.
 */
const token = "ab".repeat(32); // 64 chars hex, forme d'un vrai jeton

describe("sessionDigest", () => {
  it("produit 64 caractères hex — jamais le jeton en clair", () => {
    const d = sessionDigest(token);
    expect(d).toMatch(/^[0-9a-f]{64}$/);
    expect(d).not.toContain(token);
  });

  it("est déterministe : écrire puis relire avec la même fonction donne le même hash", () => {
    // C'est exactement ce que `createSession` et `getSessionUser` font.
    expect(sessionDigest(token)).toBe(sessionDigest(token));
  });

  it("change pour un autre jeton — pas de collision entre sessions", () => {
    expect(sessionDigest(token)).not.toBe(sessionDigest("cd".repeat(32)));
    expect(sessionDigest("")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("un jeton sensiblement différent produit un hash sans rapport", () => {
    const a = sessionDigest("ab".repeat(32));
    const b = sessionDigest(`ab".repeat(31) + "ac`);
    expect(a).not.toBe(b);
    expect(a.slice(0, 8)).not.toBe(b.slice(0, 8));
  });
});

describe("portées distinctes (digest.ts)", () => {
  it("le même jeton ne donne jamais le même hash selon l'usage", () => {
    // Un jeton de session collé dans `User.verificationTokenHash` (ou
    // l'inverse) doit être introuvable : préimpressions différentes.
    expect(sessionDigest(token)).not.toBe(verificationDigest(token));
  });

  it("verificationDigest reste déterministe", () => {
    expect(verificationDigest(token)).toBe(verificationDigest(token));
    expect(verificationDigest(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
