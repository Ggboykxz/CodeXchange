import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const city = searchParams.get("city");
  const stack = searchParams.get("stack");
  const level = searchParams.get("level");
  const available = searchParams.get("available");

  const where: Record<string, unknown> = {};
  if (country && country !== "all") where.country = country;
  if (city && city !== "all") where.city = city;
  if (stack && stack !== "all") where.stack = { contains: stack };
  if (level && level !== "all") where.level = level;
  if (available === "true") where.available = true;

  const profiles = await db.profile.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profiles });
}
