import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId, votePost } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { verifyCsrf, rotateCsrfToken } from "@/lib/csrf";

type Contexte = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    await verifyCsrf(request);
    const { id } = await params;
    const postId = parseId(id);
    if (postId === null) return NextResponse.json({ error: "NOT_FOUND", message: "Sujet introuvable." }, { status: 404 });
    const { direction } = (await request.json().catch(() => ({}))) as { direction?: unknown };
    const dir = direction === -1 ? -1 : 1;
    const vote = await votePost(postId, userId, dir);
    const response = NextResponse.json({ vote });
    await rotateCsrfToken(response);
    return response;
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}