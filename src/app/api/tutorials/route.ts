import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;

  const tutorials = await db.tutorial.findMany({
    where,
    include: { author: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
  });

  return json({ tutorials });
}
