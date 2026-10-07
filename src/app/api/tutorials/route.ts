import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.trim();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    }

    const [tutorials, total] = await Promise.all([
      db.tutorial.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.tutorial.count({ where }),
    ]);

    return NextResponse.json({
      tutorials,
      total,
      limit,
      hasMore: skip + tutorials.length < total,
    });
  } catch (e) {
    console.error("List tutorials error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list tutorials" }, { status: 500 });
  }
}
