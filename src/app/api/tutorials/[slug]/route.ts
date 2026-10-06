import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tutorial = await db.tutorial.findUnique({
      where: { slug },
      include: { author: { select: authorSelect } },
    });

    if (!tutorial) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    return NextResponse.json({ tutorial });
  } catch (e) {
    console.error("Get tutorial error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to load tutorial" }, { status: 500 });
  }
}
