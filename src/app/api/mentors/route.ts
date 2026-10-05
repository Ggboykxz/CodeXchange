import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const mentors = await db.mentor.findMany({
    include: { user: { include: { profile: true } } },
    orderBy: [{ rating: "desc" }, { reviews: "desc" }],
  });

  return json({ mentors });
}
