import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { toggleRepost } from "@/lib/reposts";

type Corps = { postId?: unknown };

/**
 * POST /api/reposts — repost / annule le repost d'un sujet.
 * Body : { postId: number }. Retour : état à jour (repostes + jeLaiReposte).
 */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }
    const corps = (await request.json().catch(() => null)) as Corps | null;
    const postId = Number(corps?.postId);
    const etat = await toggleRepost(userId, postId);
    return NextResponse.json(etat);
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
