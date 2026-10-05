import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await db.profile.findUnique({
    where: { username },
    include: {
      user: {
        include: {
          threads: { take: 5, orderBy: { createdAt: "desc" } },
          projects: { take: 5, orderBy: { stars: "desc" } },
          tutorials: { take: 3, orderBy: { createdAt: "desc" } },
          mentorProfile: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
