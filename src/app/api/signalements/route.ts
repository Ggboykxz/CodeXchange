import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createReport, estKindSignalement } from "@/lib/reports";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

/** POST /api/signalements — { kind, targetId, raison }. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { kind?: unknown; targetId?: unknown; raison?: unknown };
    if (!estKindSignalement(body.kind)) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Type de contenu invalide." }, { status: 422 });
    }
    const targetId = Number(body.targetId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Identifiant invalide." }, { status: 422 });
    }
    const id = await createReport({
      reporterId: userId,
      kind: body.kind,
      targetId,
      raison: String(body.raison ?? ""),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
