import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, toggleReplyLike, parseId } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string; rid: string }> };

export async function POST(_request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    const { rid } = await params;
    const replyId = parseId(rid);
    if (replyId === null) return NextResponse.json({ error: "NOT_FOUND", message: "Réponse introuvable." }, { status: 404 });
    const added = await toggleReplyLike(replyId, userId);
    return NextResponse.json({ like: added });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}