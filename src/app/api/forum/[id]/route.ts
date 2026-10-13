import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { aLike, getPost, parseId } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Sujet introuvable." } as const;

/** GET /api/forum/[id] — sujet complet (auteur, réponses, likes) + `likedByMe`. */
export async function GET(request: Request, { params }: Contexte) {
  try {
    const { id } = await params;
    const postId = parseId(id);
    const sujet = postId === null ? null : await getPost(postId);
    if (!sujet || postId === null) {
      return NextResponse.json(INCONNU, { status: 404 });
    }

    const userId = await getSessionUserId();
    const likedByMe = userId === null ? false : await aLike(userId, postId);
    return NextResponse.json({ sujet, likedByMe });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
