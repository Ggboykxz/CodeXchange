import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicUserSelect } from "@/lib/selects";
import { pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { limit, skip } = pagination(new URL(req.url).searchParams, 30);

    const [mentors, total] = await Promise.all([
      db.mentor.findMany({
        select: { user: { select: publicUserSelect }, ...mentorFields },
        orderBy: [{ rating: "desc" }, { reviews: "desc" }],
        take: limit,
        skip,
      }),
      db.mentor.count(),
    ]);

    return NextResponse.json({ mentors, total, limit, hasMore: skip + mentors.length < total });
  } catch (e) {
    console.error("List mentors error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list mentors" }, { status: 500 });
  }
}

const mentorFields = {
  id: true,
  userId: true,
  expertise: true,
  bio: true,
  languages: true,
  hourlyRate: true,
  capacity: true,
  slotsTaken: true,
  rating: true,
  reviews: true,
} as const;
