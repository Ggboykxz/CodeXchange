import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { menteeId, message, goal } = body;

    if (!menteeId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const mentor = await db.mentor.findUnique({ where: { id } });
    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const mentorship = await db.mentorship.create({
      data: {
        mentorId: mentor.userId,
        menteeId,
        message,
        goal: goal || null,
        status: "pending",
      },
    });

    return NextResponse.json({ mentorship });
  } catch (e) {
    console.error("Mentorship request error:", e);
    return NextResponse.json(
      { error: "Failed to create mentorship request" },
      { status: 500 }
    );
  }
}
