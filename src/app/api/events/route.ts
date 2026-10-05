import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const events = await db.event.findMany({
    include: { organizer: { include: { profile: true } } },
    orderBy: { date: "asc" },
  });

  return json({ events });
}
