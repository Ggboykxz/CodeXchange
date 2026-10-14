import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId, restoreReply } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string; rid: string }> };

/** POST /api/forum/[id]/replies/[rid]/restaurer — { corps } : annule une suppression. */
export async function POST(request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    const { rid } = await params;
    const replyId = parseId(rid);
    if (replyId === null) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Réponse introuvable." }, { status: 404 });
    }
    const corps = (await request.json().catch(() => null)) as Partial<{ corps: unknown }> | null;
    await restoreReply(replyId, userId, String(corps?.corps ?? ""));
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
