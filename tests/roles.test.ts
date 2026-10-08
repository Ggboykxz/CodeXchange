import { describe, expect, it } from "vitest";
import {
  ROLES,
  canAssignRoles,
  canChangeRole,
  isRole,
  roleDenialMessage,
} from "@/lib/roles";

/**
 * B8 — les rôles ne se changent que par ici. Le cas test verrouille deux
 * choses : la hiérarchie (seul un admin compose l'équipe) et le verrou
 * anti-lockout qui tient **sans comptage** — cf. la preuve dans
 * `lib/roles.ts`.
 */
const admin = { id: "u_admin", role: "admin" };
const otherAdmin = { id: "u_admin2", role: "admin" };
const moderator = { id: "u_mod", role: "moderator" };
const member = { id: "u_member", role: "member" };

describe("ROLES / isRole", () => {
  it("porte exactement les trois rôles, du moins au plus privilégié", () => {
    expect(ROLES).toEqual(["member", "moderator", "admin"]);
  });

  it.each(ROLES)("reconnait `%s`", (role) => {
    expect(isRole(role)).toBe(true);
  });

  it.each([
    ["", "chaine vide"],
    ["root", "rôle inventé"],
    ["Admin", "la casse ne passe pas"],
    [" admin", "espace parasite"],
    [42, "pas une chaîne"],
    [null, "null"],
    [undefined, "undefined"],
  ])("refuse %s (%s)", (value, raison) => {
    expect(isRole(value), raison).toBe(false);
  });
});

describe("canAssignRoles — qui voit l'outil de gestion", () => {
  it("admin : oui", () => expect(canAssignRoles(admin)).toBe(true));
  it("moderator : non — il gère le contenu, pas l'équipe", () =>
    expect(canAssignRoles(moderator)).toBe(false));
  it("member : non", () => expect(canAssignRoles(member)).toBe(false));
  it("déconnecté : non", () => expect(canAssignRoles(null)).toBe(false));
});

describe("canChangeRole — hiérarchie", () => {
  it("un admin peut promouvoir un member en moderator", () => {
    expect(canChangeRole({ actor: admin, target: member, nextRole: "moderator" })).toEqual({
      ok: true,
      changed: true,
    });
  });

  it("un admin peut promouvoir un member en admin", () => {
    const out = canChangeRole({ actor: admin, target: member, nextRole: "admin" });
    expect(out).toEqual({ ok: true, changed: true });
  });

  it("un admin peut rétrograder un autre admin — l'acteur reste en place", () => {
    // C'est exactement le cas qui garantit que le compteur d'admins ne
    // tombe jamais à 0 : l'acteur n'est pas la cible.
    expect(canChangeRole({ actor: admin, target: otherAdmin, nextRole: "member" })).toEqual({
      ok: true,
      changed: true,
    });
  });

  it("un member ne change aucun rôle", () => {
    expect(canChangeRole({ actor: member, target: moderator, nextRole: "admin" })).toEqual({
      ok: false,
      status: 403,
      code: "forbidden",
    });
  });

  it("un moderator ne change aucun rôle — il ne compose pas l'équipe", () => {
    expect(canChangeRole({ actor: moderator, target: member, nextRole: "admin" })).toEqual({
      ok: false,
      status: 403,
      code: "forbidden",
    });
  });

  it("un moderator ne peut pas non plus rétrograder qui que ce soit", () => {
    expect(
      canChangeRole({ actor: moderator, target: member, nextRole: "member" })
    ).toMatchObject({ ok: false, code: "forbidden" });
  });
});

describe("canChangeRole — payload", () => {
  it("refuse un rôle qui n'existe pas (400)", () => {
    expect(canChangeRole({ actor: admin, target: member, nextRole: "root" })).toEqual({
      ok: false,
      status: 400,
      code: "invalid_role",
    });
  });

  it("valide le droit avant la forme : un member envoie un rôle bidon, il est refusé pour autorisation", () => {
    // L'ordre des règles est un contrat : pas de diagnostic de payload
    // pour un appelant sans droit.
    expect(
      canChangeRole({ actor: member, target: member, nextRole: "nawak" })
    ).toMatchObject({ ok: false, code: "forbidden" });
  });
});

describe("canChangeRole — changer son propre rôle", () => {
  it("refuse à un admin de se rétrograder soi-même", () => {
    expect(canChangeRole({ actor: admin, target: admin, nextRole: "member" })).toEqual({
      ok: false,
      status: 403,
      code: "self",
    });
  });

  it("refuse aussi une auto-promotion (inutile, mais jamais silencieuse)", () => {
    expect(
      canChangeRole({ actor: moderator, target: moderator, nextRole: "admin" })
    ).toMatchObject({ ok: false, code: "forbidden" });
  });
});

describe("canChangeRole — PATCH idempotent", () => {
  it("un rôle inchangé réussit sans réécriture", () => {
    expect(canChangeRole({ actor: admin, target: member, nextRole: "member" })).toEqual({
      ok: true,
      changed: false,
    });
  });

  it("le même admin qui renvoie son rôle actuel est un no-op, pas une erreur", () => {
    expect(canChangeRole({ actor: admin, target: otherAdmin, nextRole: "admin" })).toEqual({
      ok: true,
      changed: false,
    });
  });
});

describe("canChangeRole — le verrou anti-lockout tient par construction", () => {
  // Toutes les combinaisons possibles : toute décision `ok` implique que
  // l'acteur est un admin qui n'est pas la cible, donc il reste en place.
  // Si cette propriété casse un jour, la plateforme peut finir à 0 admin.
  const cibles = [member, moderator, admin];
  const acteurs = [member, moderator, admin, { id: "u_admin_bis", role: "admin" }];

  const cas = acteurs.flatMap((actor) =>
    cibles.map((target) => ({
      nom: `${actor.role}(${actor.id}) → ${target.role} en member`,
      actor,
      target,
    }))
  );

  it.each(cas)("verrou : $nom", ({ actor, target }) => {
    const out = canChangeRole({ actor, target, nextRole: "member" });
    if (out.ok) {
      expect(actor.role).toBe("admin");
      expect(actor.id).not.toBe(target.id);
    } else {
      expect(["forbidden", "self", "invalid_role"]).toContain(out.code);
    }
  });
});

describe("roleDenialMessage", () => {
  it("couvre chaque code de refus", () => {
    expect(roleDenialMessage("forbidden")).toContain("admins");
    expect(roleDenialMessage("invalid_role")).toContain("Invalid");
    expect(roleDenialMessage("self")).toContain("your own role");
  });
});
