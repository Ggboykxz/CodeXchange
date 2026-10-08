import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUserSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";
import { currentUser, unauthorized } from "@/lib/auth";
import { canAssignRoles, isRole } from "@/lib/roles";

/**
 * GET /api/admin/users — les membres, avec leur rôle, pour l'outil de
 * gestion des rôles (B8).
 *
 * Réservé aux administrateurs : c'est le seul endpoint qui renvoie le
 * `role` d'autrui — la voie publique (`publicUserSelect`) le tient caché.
 *
 * La recherche peut **viser** un e-mail (retrouver un compte signalé)
 * sans jamais le **rendre** : il ne figure ni dans le sélecteur, ni dans
 * `json()` qui le retire de toute façon. Trouver un compte n'autorise
 * pas à lire son adresse.
 */
export async function GET(req: NextRequest) {
  try {
    const actor = await currentUser(req);
    if (!actor) return unauthorized();
    if (!canAssignRoles(actor)) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const roleFilter = searchParams.get("role");
    const { limit, skip } = pagination(searchParams, 24);

    // Un filtre hors barème est refusé plutôt qu'ignoré : l'ignorer
    // renverrait *plus* de monde que demandé, sans que personne ne
    // s'en aperçoive.
    if (roleFilter && !isRole(roleFilter)) {
      return NextResponse.json({ error: "Invalid role filter" }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (roleFilter) where.role = roleFilter;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { profile: { username: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: { name: "asc" },
        take: limit,
        skip,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      limit,
      hasMore: skip + users.length < total,
    });
  } catch (e) {
    logger.route("List admin users error", e);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
