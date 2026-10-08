/**
 * Rôles CodeXchange — hiérarchie et règles de changement (B8).
 *
 * Module **pur** : ni Prisma, ni Next, ni base de données. Tout ce qui
 * décide « qui a le droit de changer quoi » vit ici, pour trois raisons :
 *
 *   1. le test en vitest n'a pas besoin d'accéder à une base ;
 *   2. l'écran d'administration, la validation zod et l'API partagent
 *      la même source — la règle ne peut pas dériver d'une couche à
 *      l'autre ;
 *   3. le verrou anti-lockout s'exprime une seule fois, en une phrase.
 */

/** Les trois rôles, du moins au plus privilégié. */
export const ROLES = ["member", "moderator", "admin"] as const;

export type Role = (typeof ROLES)[number];

/**
 * Garde de type : `role` vient d'une colonne `String` de la base, pas
 * d'une enum Prisma — on ne peut donc pas se fier au typage statique.
 */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Décision rendue par `canChangeRole` : soit la modification passe,
 * soit elle est refusée avec le statut HTTP et le code à renvoyer.
 */
export type RoleChangeDecision =
  | { ok: true; changed: boolean }
  | { ok: false; status: 400 | 403; code: "invalid_role" | "forbidden" | "self" };

/**
 * Peut-on attribuer des rôles ? Gate unique pour l'API **et** pour
 * l'affichage (entrée « Admin » de la navigation, écran dédié).
 *
 * `role` optionnel ou `null` : côté client il vient d'un store partiellement
 * rempli — un user sans rôle lu reste un simple visiteur.
 */
export function canAssignRoles(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === "admin";
}

/**
 * Un changement de rôle n'est légitime que si trois conditions tiennent,
 * dans cet ordre (le droit avant la forme : un appelant sans droit
 * n'obtient aucun diagnostic sur le payload de sa requête).
 *
 *  1. **Seul un administrateur attribue des rôles.** Les modérateurs
 *     gèrent le contenu (accepter, épingler, supprimer) via `isStaff`,
 *     mais ne composent pas l'équipe : gérer qui est modérateur, c'est
 *     déjà le pouvoir qu'on surveille.
 *  2. **Le rôle demandé doit exister** — member | moderator | admin.
 *  3. **Personne ne se change soi-même.** Un administrateur qui se
 *     rétrograde perd l'accès à l'outil qui pourrait le lui rendre : on
 *     refuse, et on laisse la main à un collègue (un admin en promeut
 *     un second, puis se faire rétrograder par lui).
 *
 * ### Verrou anti-lockout, sans comptage
 *
 * On ne compte **jamais** les administrateurs en base : ce serait une
 * lecture suivie d'une écriture — une fenêtre de course où deux admins
 * qui se rétrogradent au même instant laisseraient la plateforme sans
 * aucun administrateur. Ici l'invariant tient par construction : l'acteur
 * doit être un admin (règle 1) et ne peut pas être la cible (règle 3),
 * donc il reste en place après n'importe quelle rétrogradation d'un
 * tiers. Le compteur d'admins ne peut pas tomber à 0, quelle que soit
 * l'interleaving — sans une seule requête de comptage.
 */
export function canChangeRole(input: {
  actor: { id: string; role: string };
  target: { id: string; role: string };
  nextRole: string;
}): RoleChangeDecision {
  if (!canAssignRoles(input.actor)) {
    return { ok: false, status: 403, code: "forbidden" };
  }
  if (!isRole(input.nextRole)) {
    return { ok: false, status: 400, code: "invalid_role" };
  }
  if (input.actor.id === input.target.id) {
    return { ok: false, status: 403, code: "self" };
  }
  // `changed: false` = pas une erreur : PATCH idempotent, la route
  // se contente de renvoyer l'utilisateur sans réécrire ni notifier.
  return { ok: true, changed: input.nextRole !== input.target.role };
}

/** Message d'erreur API pour un refus — un seul endroit, réutilisé par la route. */
export type RoleDenialCode = Extract<RoleChangeDecision, { ok: false }>["code"];

export function roleDenialMessage(code: RoleDenialCode): string {
  switch (code) {
    case "forbidden":
      return "Only admins can manage roles";
    case "invalid_role":
      return "Invalid role";
    case "self":
      return "You cannot change your own role";
  }
}
