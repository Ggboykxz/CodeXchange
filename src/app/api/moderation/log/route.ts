import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, isStaff, unauthorized } from "@/lib/auth";
import { logger } from "@/lib/log";

/**
 * GET /api/moderation/log — journal de modération (staff seulement) :
 * épinglages, résolutions de signalements, suppressions… Pagination
 * bornée, plus récent d'abord.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff only" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "50")));

    const [logs, total] = await Promise.all([
      db.moderationLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: { select: { id: true, name: true, profile: { select: { username: true } } } },
        },
      }),
      db.moderationLog.count(),
    ]);

    return NextResponse.json({ logs, total, page, pageSize });
  } catch (e) {
    logger.route("Moderation log error", e);
    return NextResponse.json({ error: "Failed to load moderation log" }, { status: 500 });
  }
}
