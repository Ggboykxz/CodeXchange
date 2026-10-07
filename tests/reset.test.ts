import { describe, expect, it } from "vitest";
import {
  passwordResetUrl,
  validateResetToken,
  RESET_TTL_MS,
} from "@/lib/reset";
import { SITE_URL } from "@/lib/site";
import { resetSchema } from "@/lib/validate";

/**
 * B7 — helpers purs de la réinitialisation.
 *
 * Aucune requête en base ici : `validateResetToken` ne
 * touche la DB que pour un jeton **bien formé** ; les
 * cas malformés sont refusés avant tout hash (fast-path).
 */
describe("reset — URL et forme du jeton", () => {
  it("construit l'URL de la page /reset avec le jeton", () => {
    const token = "a".repeat(64);
    expect(passwordResetUrl(token)).toBe(
      `${SITE_URL}/reset?token=${token}`
    );
  });

  it("TTL de 30 minutes", () => {
    expect(RESET_TTL_MS).toBe(30 * 60 * 1000);
  });

  it("refuse un jeton malformé AVANT toute requête", async () => {
    for (const bad of ["", "abc", "z".repeat(64), "a".repeat(63)]) {
      const res = await validateResetToken(bad);
      expect(res.outcome).toBe("invalid");
      expect(res.userId).toBeNull();
    }
  });
});

describe("reset — schéma de confirmation", () => {
  it("accepte jeton 64 hex + mot de passe conforme", () => {
    const parsed = resetSchema.safeParse({
      token: "b".repeat(64),
      password: "newpass123",
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse un mot de passe sans chiffre", () => {
    const parsed = resetSchema.safeParse({
      token: "b".repeat(64),
      password: "passwordonly",
    });
    expect(parsed.success).toBe(false);
  });

  it("refuse un jeton trop court", () => {
    const parsed = resetSchema.safeParse({
      token: "short",
      password: "newpass123",
    });
    expect(parsed.success).toBe(false);
  });
});
