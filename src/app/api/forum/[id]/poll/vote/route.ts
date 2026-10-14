import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId, votePoll } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    const { id } = await params;
    const postId = parseId(id);
    if (postId === null) return NextResponse.json({ error: "NOT_FOUND", message: "Sujet introuvable." }, { status: 404 });
    const { optionId } = (await request.json().catch(() => ({}))) as { optionId?: unknown };
    const oid = Number(optionId);
    if (!Number.isInteger(oid) || oid <= 0) {
      return NextResponse.json({ error: "VALIDATION", message: "Option invalide." }, { status: 400 });
    }
    await votePoll(oid, userId);
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
