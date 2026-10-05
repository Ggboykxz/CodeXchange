import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const type = searchParams.get("type");
  const remote = searchParams.get("remote");
  const stack = searchParams.get("stack");

  const where: Record<string, unknown> = {};
  if (country && country !== "all") where.country = country;
  if (type && type !== "all") where.type = type;
  if (remote === "true") where.remote = true;
  if (stack && stack !== "all") where.stack = { contains: stack };

  const jobs = await db.job.findMany({
    where,
    include: { author: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return json({ jobs });
}
