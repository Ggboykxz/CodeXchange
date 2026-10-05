import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tutorial = await db.tutorial.findUnique({
    where: { slug },
    include: { author: { include: { profile: true } } },
  });

  if (!tutorial) {
    return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  }

  return NextResponse.json({ tutorial });
}
