import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const stack = searchParams.get("stack");
    const q = searchParams.get("q")?.trim();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (stack && stack !== "all") where.stack = { contains: stack, mode: "insensitive" };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { tagline: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { stack: { contains: q, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: [{ stars: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip,
      }),
      db.project.count({ where }),
    ]);

    return NextResponse.json({ projects, total, limit, hasMore: skip + projects.length < total });
  } catch (e) {
    console.error("List projects error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}
