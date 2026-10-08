import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, rateLimited } from "@/lib/api";
import { adminUserSelect } from "@/lib/selects";
import { roleUpdateSchema } from "@/lib/validate";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { canAssignRoles, canChangeRole, roleDenialMessage } from "@/lib/roles";
import { notify } from "@/lib/notify";

/** Libellés français des rôles — les notifications serveur sont en français (convention I1). */
const ROLE_LABELS: Record<string, string> = {
  member: "membre",
  moderator: "modérateur",
  admin: "administrateur",
};

/**
 * PATCH /api/admin/users/[id] — changer le rôle d'un membre (B8).
 *
 * Trois portes, dans cet ordre : session valide → quota d'écriture →
 * droit d'administrateur. Ensuite seulement le payload est validé, puis
 * la cible existe — un appelant sans droit n'apprend rien, ni sur la
 * forme attendue, ni sur l'existence d'un compte (403 avant 404).
 *
 * Le verrou anti-lockout (« le dernier admin n'est jamais rétrogradé »)
 * n'est pas une requête de comptage mais une propriété de `canChangeRole`
 * : l'acteur, admin et jamais la cible, reste en place. Voir la preuve
 * dans `lib/roles.ts`.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await currentUser(req);
    if (!actor) return unauthorized("You must be signed in to manage roles");

    const limited = rateLimit(
      `admin-role:${actor.id}`,
      WRITE_POLICY.limit,
      WRITE_POLICY.windowMs
    );
    if (!limited.ok) return rateLimited("Too many writes. Slow down.", limited.retryAfterSec);

    if (!canAssignRoles(actor)) {
      return NextResponse.json({ error: roleDenialMessage("forbidden") }, { status: 403 });
    }

    const parsed = roleUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid role payload", parsed.error.flatten().fieldErrors);
    }

    const { id } = await params;
    const target = await db.user.findUnique({ where: { id }, select: adminUserSelect });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const decision = canChangeRole({ actor, target, nextRole: parsed.data.role });
    if (!decision.ok) {
      return NextResponse.json(
        { error: roleDenialMessage(decision.code) },
        { status: decision.status }
      );
    }

    // PATCH idempotent : le rôle demandé est déjà celui de la cible —
    // ni réécriture, ni notification, on renvoie l'état actuel.
    if (!decision.changed) {
      return json({ user: target });
    }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
      select: adminUserSelect,
    });

    // Audit (J8) : qui, quoi, depuis quel rôle — dans le journal structuré.
    logger.info("Role changed", {
      actorId: actor.id,
      targetId: target.id,
      from: target.role,
      to: parsed.data.role,
    });

    // La cible doit savoir qu'on a touché à son compte (I1).
    notify({
      recipientId: target.id,
      actorId: actor.id,
      type: "system",
      title: "Changement de rôle",
      body: `Tu es désormais ${ROLE_LABELS[parsed.data.role] ?? parsed.data.role} sur CodeXchange.`,
    });

    return json({ user: updated });
  } catch (e) {
    logger.route("Role update error", e);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
