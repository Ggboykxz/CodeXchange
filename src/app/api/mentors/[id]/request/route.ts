import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { mentorRequestSchema } from "@/lib/validate";

/**
 * POST /api/mentors/[id]/request — demander un mentorat.
 *
 * `menteeId` n'est plus accepté du body : il provient de la session.
 * (Auparavant, un appelant pouvait forger une demande entre deux tiers utilisateurs.)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to request a mentor");

    const { id } = await params;
    const parsed = mentorRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const mentor = await db.mentor.findUnique({ where: { id } });
    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }
    if (mentor.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot request yourself as a mentor" },
        { status: 422 }
      );
    }
    if (mentor.slotsTaken >= mentor.capacity) {
      return NextResponse.json(
        { error: "This mentor has no free slot right now" },
        { status: 409 }
      );
    }

    // Pas de demande en double en attente.
    const existing = await db.mentorship.findFirst({
      where: { mentorId: mentor.userId, menteeId: user.id, status: "pending" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request with this mentor" },
        { status: 409 }
      );
    }

    const mentorship = await db.mentorship.create({
      data: {
        mentorId: mentor.userId,
        menteeId: user.id,
        message: parsed.data.message,
        goal: parsed.data.goal || null,
        status: "pending",
      },
    });

    return NextResponse.json({ mentorship }, { status: 201 });
  } catch (e) {
    console.error("Mentorship request error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Failed to create mentorship request" },
      { status: 500 }
    );
  }
}
