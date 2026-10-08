import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";

/**
 * GET /api/leaderboard — F5 : top 10 des contributeurs par réputation.
 *
 * La réputation est un vrai score cumulé (votes + réponses acceptées) :
 * rien n'est calculé « pour faire joli ». Cas d'égalité (très fréquent à
 * zéro contribution) : l'ancienneté départage, les membres historiques
 * passent d'abord — pas d'ordre aléatoire d'un refresh à l'autre.
 */
export async function GET(_req: NextRequest) {
  try {
    const top = await db.user.findMany({
      orderBy: [{ reputation: "desc" }, { createdAt: "asc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        reputation: true,
        profile: {
          select: { username: true, avatarColor: true, headline: true, level: true },
        },
      },
    });

    return NextResponse.json(
      { top },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    logger.route("Leaderboard error", e);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
