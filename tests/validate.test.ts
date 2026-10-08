import { describe, expect, it } from "vitest";
import {
  loginSchema,
  pagination,
  registerSchema,
  roleUpdateSchema,
  verifySchema,
  voteSchema,
} from "@/lib/validate";

const base = {
  name: "Aïcha Diallo",
  email: "Aicha.Diallo@Codexchange.dev",
  password: "Motdepasse1",
  username: "aicha.dev",
  country: "Sénégal",
  city: "Dakar",
  stack: "React, TypeScript",
  level: "senior" as const,
};

describe("registerSchema", () => {
  it("accepte un profil complet et normalise l'email", () => {
    const r = registerSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("aicha.diallo@codexchange.dev");
  });

  it.each([
    ["trop court", "Mot1"],
    ["sans chiffre", "Motdepasse"],
    ["sans lettre", "123456789"],
    ["vide", ""],
  ])("refuse le mot de passe %s", (_label, password) => {
    expect(registerSchema.safeParse({ ...base, password }).success).toBe(false);
  });

  it.each([
    ["avec espace", "aicha diallo"],
    ["avec @", "aicha@diallo"],
    ["commençant par un tiret", "-aicha"],
    ["terminant par un tiret", "aicha-"],
    ["trop court", "ai"],
    ["avec un caractère accentué", "aïcha"],
  ])("refuse le username %s", (_label, username) => {
    expect(registerSchema.safeParse({ ...base, username }).success).toBe(false);
  });

  it("normalise le username en minuscules avant de le valider", () => {
    // `.toLowerCase()` précède le regex : on refuse `Aicha.Diallo` *en
    // l'état*, on le stocke `aicha.diallo`. Deux inscriptions qui ne
    // différeraient que par la casse ne créent donc pas deux comptes.
    const r = registerSchema.safeParse({ ...base, username: "Aicha.Diallo" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBe("aicha.diallo");
  });

  it("refuse un email malformé", () => {
    expect(registerSchema.safeParse({ ...base, email: "pas-un-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, email: "" }).success).toBe(false);
  });

  it("refuse un niveau hors barème", () => {
    expect(registerSchema.safeParse({ ...base, level: "gourou" }).success).toBe(false);
  });

  it("rejette les champs inconnus plutôt que de les stocker tels quels", () => {
    // `role` et `reputation` arrivent dans le body d'un client malveillant :
    // le schéma les ignore (strict), ils ne peuvent donc pas sortir de
    // `db.user.create`.
    const r = registerSchema.safeParse({ ...base, role: "admin", reputation: 9999 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("role");
      expect(r.data).not.toHaveProperty("reputation");
    }
  });
});

describe("loginSchema", () => {
  it("n'exige qu'un email et un mot de passe (pas de username)", () => {
    expect(
      loginSchema.safeParse({ email: "aicha.diallo@codexchange.dev", password: "Motdepasse1" })
        .success
    ).toBe(true);
  });

  it("tolère la casse de l'email mais exige les deux champs", () => {
    const ok = loginSchema.safeParse({ email: "  AICHA.DIALLO@CODEXCHANGE.DEV ", password: "x" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("aicha.diallo@codexchange.dev");

    expect(loginSchema.safeParse({ email: "a@b.dev" }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "Motdepasse1" }).success).toBe(false);
  });
});

describe("voteSchema — barème du CDC §3.2", () => {
  it.each([1, -1, 0])("accepte la valeur %i", (value) => {
    expect(voteSchema.safeParse({ target: "thread", targetId: "clxyz001", value }).success).toBe(
      true
    );
  });

  it.each([2, -2, 3, 0.5, null, "1", undefined])("refuse la valeur %s", (value) => {
    expect(voteSchema.safeParse({ target: "post", targetId: "clxyz001", value }).success).toBe(
      false
    );
  });

  it("n'accepte que `thread` ou `post` comme cible", () => {
    expect(voteSchema.safeParse({ target: "user", targetId: "x", value: 1 }).success).toBe(false);
    expect(voteSchema.safeParse({ target: "post", targetId: "x", value: 1 }).success).toBe(true);
  });
});

describe("verifySchema — jeton de vérification d'e-mail", () => {
  it("accepte 64 caractères hex (32 octets), insensible à la casse", () => {
    expect(verifySchema.safeParse({ token: "ab".repeat(32) }).success).toBe(true);
    expect(verifySchema.safeParse({ token: "AB".repeat(32) }).success).toBe(true);
  });

  it.each([
    ["une chaîne vide", ""],
    ["trop court", "ab".repeat(31)],
    ["trop long", "ab".repeat(33)],
    ["non hexadécimal", "zz".repeat(32)],
    ["un objet", { token: "x" }],
    ["une valeur absente", undefined],
  ])("refuse %s", (_label, token) => {
    expect(verifySchema.safeParse({ token }).success).toBe(false);
  });

  it("trimpe avant de comparer — le jeton collé depuis un lien tient encore", () => {
    expect(verifySchema.safeParse({ token: ` ${"ab".repeat(32)}\n` }).success).toBe(true);
  });
});

describe("pagination", () => {
  it("applique les bornes (limit 1..100, page >= 1)", () => {
    expect(pagination(new URLSearchParams("limit=999"))).toMatchObject({ limit: 100, page: 1 });
    expect(pagination(new URLSearchParams("limit=0"))).toMatchObject({ limit: 20, page: 1 });
    expect(pagination(new URLSearchParams("page=-3"))).toMatchObject({ page: 1 });
    expect(pagination(new URLSearchParams("page=abc"))).toMatchObject({ page: 1 });
    expect(pagination(new URLSearchParams("limit=25&page=3"))).toMatchObject({
      limit: 25,
      page: 3,
      skip: 50,
    });
  });

  it("retombe sur les valeurs par défaut quand la query est vide", () => {
    expect(pagination(new URLSearchParams())).toMatchObject({ limit: 20, page: 1, skip: 0 });
    expect(pagination(new URLSearchParams(), 50)).toMatchObject({ limit: 50 });
  });
});

describe("roleUpdateSchema — B8, changement de rôle", () => {
  it.each(["member", "moderator", "admin"])("accepte `%s`", (role) => {
    expect(roleUpdateSchema.safeParse({ role }).success).toBe(true);
  });

  it.each([
    ["root", "rôle inventé"],
    ["Admin", "la casse ne passe pas"],
    ["member ", "espace parasite"],
    ["", "chaine vide"],
    ["superuser", "rôle hors barème"],
  ])("refuse `%s` (%s)", (role) => {
    expect(roleUpdateSchema.safeParse({ role }).success).toBe(false);
  });

  it("exige `role` et écarte les champs inconnus de la payload", () => {
    // zod retire les clés non déclarées par défaut : un `id` envoyé par
    // le client ne peut pas dévier l'écriture, seule la route choisit la cible.
    const out = roleUpdateSchema.safeParse({ role: "admin", id: "u_evil" });
    expect(out.success).toBe(true);
    expect(out.success && out.data).toEqual({ role: "admin" });
    expect(roleUpdateSchema.safeParse({}).success).toBe(false);
    expect(roleUpdateSchema.safeParse(null).success).toBe(false);
  });
});
