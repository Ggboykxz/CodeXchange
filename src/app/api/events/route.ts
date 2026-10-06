import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { limit, skip } = pagination(new URL(req.url).searchParams, 40);

    const [events, total] = await Promise.all([
      db.event.findMany({
        include: { organizer: { select: authorSelect } },
        orderBy: { date: "asc" },
        take: limit,
        skip,
      }),
      db.event.count(),
    ]);

    return NextResponse.json({ events, total, limit, hasMore: skip + events.length < total });
  } catch (e) {
    console.error("List events error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list events" }, { status: 500 });
  }
}
