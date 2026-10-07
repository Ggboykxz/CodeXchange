import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicUserSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";

/** Colonnes publiques d'un profil. */
const profileFields = {
  id: true,
  username: true,
  headline: true,
  bio: true,
  country: true,
  city: true,
  stack: true,
  level: true,
  github: true,
  twitter: true,
  linkedin: true,
  website: true,
  available: true,
  avatarColor: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const stack = searchParams.get("stack");
    const level = searchParams.get("level");
    const available = searchParams.get("available");
    const q = searchParams.get("q")?.trim();
    const { limit, skip } = pagination(searchParams, 48);

    const where: Record<string, unknown> = {};
    if (country && country !== "all") where.country = country;
    if (city && city !== "all") where.city = city;
    if (stack && stack !== "all") where.stack = { contains: stack, mode: "insensitive" };
    if (level && level !== "all") where.level = level;
    if (available === "true") where.available = true;
    if (q) {
      where.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { headline: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { stack: { contains: q, mode: "insensitive" } },
      ];
    }

    const [profiles, total] = await Promise.all([
      db.profile.findMany({
        where,
        // Pas d'`include: { user: true }` : ça exposerait passwordHash.
        select: { user: { select: publicUserSelect }, ...profileFields },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.profile.count({ where }),
    ]);

    return NextResponse.json({
      profiles,
      total,
      limit,
      hasMore: skip + profiles.length < total,
    });
  } catch (e) {
    console.error("List profiles error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list profiles" }, { status: 500 });
  }
}
