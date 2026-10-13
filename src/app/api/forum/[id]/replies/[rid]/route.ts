import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, editReply, deleteReply, toggleReplyLike, parseId } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string; rid: string }> };

/** PUT /api/forum/[id]/replies/[rid] — édition (auteur). DELETE — suppression douce. POST .../like — toggle. */
export async function PUT(request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    const { rid } = await params;
    const replyId = parseId(rid);
    if (replyId === null) return NextResponse.json({ error: "NOT_FOUND", message: "Réponse introuvable." }, { status: 404 });
    const body = (await request.json().catch(() => null)) as Partial<{ corps: unknown }> | null;
    await editReply(replyId, userId, String(body?.corps ?? ""));
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    const { rid } = await params;
    const replyId = parseId(rid);
    if (replyId === null) return NextResponse.json({ error: "NOT_FOUND", message: "Réponse introuvable." }, { status: 404 });
    await deleteReply(replyId, userId);
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}