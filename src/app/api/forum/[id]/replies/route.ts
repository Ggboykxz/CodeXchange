import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, addReply, parseId } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };
type CorpsReponse = Partial<{ corps: unknown }>;

const INCONNU = { error: "NOT_FOUND", message: "Sujet introuvable." } as const;

/** POST /api/forum/[id]/replies — réponse à un sujet (session obligatoire). */
export async function POST(request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const { id } = await params;
    const postId = parseId(id);
    if (postId === null) return NextResponse.json(INCONNU, { status: 404 });

    const corps = (await request.json().catch(() => null)) as CorpsReponse | null;
    await addReply(postId, userId, String(corps?.corps ?? ""));
    return NextResponse.json({ ok: true, postId }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
