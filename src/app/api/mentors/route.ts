import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const mentors = await db.mentor.findMany({
    include: { user: { include: { profile: true } } },
    orderBy: [{ rating: "desc" }, { reviews: "desc" }],
  });

  return NextResponse.json({ mentors });
}
