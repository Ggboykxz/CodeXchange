import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { listNotifications, unreadCount } from "@/lib/notifications";
import { getSessionUserId } from "@/lib/session";

/** GET /api/notifications — notifications de l'utilisateur connecté. Query: ?unread=1&limit=20 */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const url = new URL(request.url);
    const unread = url.searchParams.get("unread") === "1";
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 20;

    const notifications = await listNotifications(userId, { limit, unreadOnly: unread });
    const nonLues = await unreadCount(userId);

    return NextResponse.json({
      notifications,
      items: notifications,
      data: notifications,
      unread: nonLues,
      count: nonLues,
      compte: nonLues,
      nonLues,
    });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
