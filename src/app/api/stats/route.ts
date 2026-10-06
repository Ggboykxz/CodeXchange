import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/stats — compteurs globaux.
 * Cache 60 s côté navigateur/CDN : `distinct: ["country"]` scanne toute la
 * table Profile (non indexable), inutile de le refaire à chaque affichage.
 */
export async function GET() {
  try {
    const [users, threads, jobs, projects, mentors, tutorials, events, countries] =
      await Promise.all([
        db.user.count(),
        db.thread.count(),
        db.job.count(),
        db.project.count(),
        db.mentor.count(),
        db.tutorial.count(),
        db.event.count(),
        db.profile.findMany({
          where: { country: { not: null } },
          select: { country: true },
          distinct: ["country"],
        }),
      ]);

    return NextResponse.json(
      {
        stats: {
          users,
          threads,
          jobs,
          projects,
          mentors,
          tutorials,
          events,
          countries: countries.length,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    console.error("Stats error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
