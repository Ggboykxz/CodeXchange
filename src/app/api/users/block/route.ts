import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { toggleBlock } from "@/lib/blocks";

type Corps = { userId?: unknown };

/**
 * POST /api/users/block — bloque / débloque un membre.
 * Body : { userId: number } (la cible). Retour : { blocked: boolean }.
 */
export async function POST(request: Request) {
  try {
    const monId = await getSessionUserId();
    if (monId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }
    const corps = (await request.json().catch(() => null)) as Corps | null;
    const cibleId = Number(corps?.userId);
    const blocked = await toggleBlock(monId, cibleId);
    return NextResponse.json({ blocked });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
