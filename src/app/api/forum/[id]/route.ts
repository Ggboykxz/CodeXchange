import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { aLike, editPost, getPost, parseId } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Sujet introuvable." } as const;

/** GET /api/forum/[id] — sujet complet (auteur, réponses, likes) + `likedByMe`. */
/** PATCH /api/forum/[id] — modification du sujet par son auteur. */
export async function PATCH(request: Request, { params }: Contexte) {
  try {
    const { id } = await params;
    const postId = parseId(id);
    if (postId === null) {
      return NextResponse.json(INCONNU, { status: 404 });
    }
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Connexion requise." }, { status: 401 });
    }
    const body = await request.json().catch(() => null) as { titre?: string; corps?: string; tags?: string[] } | null;
    if (!body || typeof body.titre !== "string" || typeof body.corps !== "string" || !Array.isArray(body.tags)) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "Données invalides." }, { status: 400 });
    }
    await editPost(postId, userId, { titre: body.titre, corps: body.corps, tags: body.tags });
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
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
