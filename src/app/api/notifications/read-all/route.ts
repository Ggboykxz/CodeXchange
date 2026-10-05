import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json } from "@/lib/api";
import { sessionUserId } from "@/lib/session";

/** POST /api/notifications/read-all — mark every notification as read. */
export async function POST(req: NextRequest) {
  const userId = sessionUserId(req);
  if (!userId) return json({ error: "Authentication required" }, { status: 401 });

  const updated = await db.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });

  return json({ updated: updated.count });
}
