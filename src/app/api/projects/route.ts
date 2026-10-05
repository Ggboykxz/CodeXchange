import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const stack = searchParams.get("stack");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (stack && stack !== "all") where.stack = { contains: stack };

  const projects = await db.project.findMany({
    where,
    include: { author: { include: { profile: true } } },
    orderBy: [{ stars: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return json({ projects });
}
