import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId, toggleLike } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { verifyCsrf, rotateCsrfToken } from "@/lib/csrf";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Sujet introuvable." } as const;

/** POST /api/forum/[id]/like — like idempotent : `actif: true` puis `false`. */
export async function POST(request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }
    await verifyCsrf(request);

    const { id } = await params;
    const postId = parseId(id);
    if (postId === null) return NextResponse.json(INCONNU, { status: 404 });

    const actif = await toggleLike(postId, userId);
    const response = NextResponse.json({ actif });
    await rotateCsrfToken(response);
    return response;
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}