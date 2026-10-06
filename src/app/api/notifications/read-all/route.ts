import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json } from "@/lib/api";
import { currentUser } from "@/lib/auth";

/** POST /api/notifications/read-all — mark every notification as read. */
export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) return json({ error: "Authentication required" }, { status: 401 });

  const updated = await db.notification.updateMany({
    where: { recipientId: user.id, read: false },
    data: { read: true },
  });

  return json({ updated: updated.count });
}
