import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { toggleReaction, type ReactionKind } from "@/lib/reactions";

type Corps = { kind?: unknown; targetId?: unknown; emoji?: unknown };

/**
 * POST /api/reactions — pose/remplace/retire une réaction sur un post ou une réponse.
 * Body : { kind: "post" | "reply", targetId: number, emoji: string }.
 * Retour : les agrégats à jour de la cible (compteurs + maReaction).
 */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const corps = (await request.json().catch(() => null)) as Corps | null;
    const kind = String(corps?.kind ?? "") as ReactionKind;
    const targetId = Number(corps?.targetId);
    const emoji = String(corps?.emoji ?? "");

    const agregats = await toggleReaction(userId, kind, targetId, emoji);
    return NextResponse.json(agregats);
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
