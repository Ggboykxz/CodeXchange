import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { toggleFollow } from "@/lib/follows";

type Corps = { userId?: unknown };

/**
 * POST /api/users/follow — suit / ne suit plus un utilisateur.
 * Body : { userId: number } (la cible). Retour : compteurs à jour + jeLeSuis.
 */
export async function POST(request: Request) {
  try {
    const monId = await getSessionUserId();
    if (monId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }
    const corps = (await request.json().catch(() => null)) as Corps | null;
    const cibleId = Number(corps?.userId);
    const compteurs = await toggleFollow(monId, cibleId);
    return NextResponse.json(compteurs);
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
