import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { markAllRead } from "@/lib/notifications";
import { getSessionUserId } from "@/lib/session";

/** POST /api/notifications/tout-lire — marque toutes les notifications comme lues. */
export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const updated = await markAllRead(userId);
    return NextResponse.json({ ok: true, updated });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
