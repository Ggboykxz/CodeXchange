import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { unreadCount } from "@/lib/notifications";
import { getSessionUserId } from "@/lib/session";

/** GET /api/notifications/compte — nombre de notifications non lues. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const compte = await unreadCount(userId);
    return NextResponse.json({ compte, count: compte, unread: compte, nonLues: compte });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
