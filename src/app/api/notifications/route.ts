import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json } from "@/lib/api";
import { currentUser } from "@/lib/auth";

/**
 * GET  /api/notifications           → latest notifications + unread count
 * PATCH /api/notifications          → mark one as read { id }
 * POST /api/notifications/read-all  → mark everything as read
 */
export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) return json({ notifications: [], unread: 0 });

  const [notifications, unread] = await Promise.all([
    db.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: { select: { id: true, name: true, image: true } },
      },
    }),
    db.notification.count({ where: { recipientId: user.id, read: false } }),
  ]);

  return json({ notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) return json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = z.object({ id: z.string().min(1).max(64) }).safeParse(body);
  if (!parsed.success) return json({ error: "Missing id" }, { status: 400 });
  const { id } = parsed.data;

  // Scoped by recipient so a user can never mark someone else's feed read.
  const updated = await db.notification.updateMany({
    where: { id, recipientId: user.id },
    data: { read: true },
  });

  return json({ updated: updated.count });
}
