import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId } from "@/lib/forum";
import { markRead } from "@/lib/notifications";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Notification introuvable." } as const;

/** POST /api/notifications/[id]/lu — marque une notification comme lue. */
export async function POST(_request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const { id } = await params;
    const notificationId = parseId(id);
    if (notificationId === null) return NextResponse.json(INCONNU, { status: 404 });

    const updated = await markRead(notificationId, userId);
    if (updated === 0) return NextResponse.json(INCONNU, { status: 404 });

    return NextResponse.json({ ok: true, updated });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
