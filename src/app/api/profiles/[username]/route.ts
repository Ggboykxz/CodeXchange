import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicUserSelect } from "@/lib/selects";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const profile = await db.profile.findUnique({
      where: { username },
      include: {
        user: {
          // Sélectif : sinon `passwordHash` + `role` partent en clair.
          select: {
            ...publicUserSelect,
            reputation: true,
            threads: { take: 5, orderBy: { createdAt: "desc" as const } },
            projects: { take: 5, orderBy: { stars: "desc" as const } },
            tutorials: { take: 3, orderBy: { createdAt: "desc" as const } },
            mentorProfile: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // F5 — compteurs réels derrière les badges : 4 COUNT au lieu de
    // renvoyer des listes complètes (les slices `take: 5` ci-dessus ne
    // donnent jamais un total honnête).
    const [threads, posts, accepted, mentorships] = await Promise.all([
      db.thread.count({ where: { authorId: profile.userId } }),
      db.post.count({ where: { authorId: profile.userId } }),
      db.post.count({ where: { authorId: profile.userId, isAnswer: true } }),
      db.mentorship.count({ where: { mentorId: profile.userId, status: "completed" } }),
    ]);

    return NextResponse.json({
      profile,
      stats: { threads, posts, accepted, mentorships },
    });
  } catch (e) {
    logger.route("Get profile error", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
