import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";
import { sessionUserId } from "@/lib/session";
import { notify } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { message, goal } = body;

    const menteeId = sessionUserId(req);
    if (!menteeId) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    if (!message) {
      return json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const mentor = await db.mentor.findUnique({ where: { id } });
    if (!mentor) {
      return json({ error: "Mentor not found" }, { status: 404 });
    }
    if (mentor.userId === menteeId) {
      return json({ error: "You cannot mentor yourself" }, { status: 400 });
    }

    const duplicate = await db.mentorship.findFirst({
      where: { mentorId: mentor.userId, menteeId, status: "pending" },
    });
    if (duplicate) {
      return json(
        { error: "You already have a pending request with this mentor" },
        { status: 409 }
      );
    }
    if (mentor.slotsTaken >= mentor.capacity) {
      return json({ error: "This mentor has no free slot left" }, { status: 409 });
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

    const mentee = await db.user.findUnique({
      where: { id: menteeId },
      select: { name: true },
    });
    await notify({
      recipientId: mentor.userId,
      actorId: menteeId,
      type: "mentorship",
      title: `${mentee?.name ?? "Un dev"} demande ton mentorat`,
      body: message.slice(0, 140),
      href: "#mentorat",
    });

    return json({ mentorship });
  } catch (e) {
    console.error("Mentorship request error:", e);
    return json(
      { error: "Failed to create mentorship request" },
      { status: 500 }
    );
  }
}
