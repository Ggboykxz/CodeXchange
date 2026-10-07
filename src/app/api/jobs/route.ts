import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const type = searchParams.get("type");
    const remote = searchParams.get("remote");
    const stack = searchParams.get("stack");
    const q = searchParams.get("q")?.trim();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (country && country !== "all") where.country = country;
    if (type && type !== "all") where.type = type;
    if (remote === "true") where.remote = true;
    if (stack && stack !== "all") where.stack = { contains: stack, mode: "insensitive" };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { stack: { contains: q, mode: "insensitive" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.job.count({ where }),
    ]);

    return NextResponse.json({ jobs, total, limit, hasMore: skip + jobs.length < total });
  } catch (e) {
    console.error("List jobs error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}
