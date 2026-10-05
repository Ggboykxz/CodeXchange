import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [users, threads, jobs, projects, mentors, tutorials, events] =
    await Promise.all([
      db.user.count(),
      db.thread.count(),
      db.job.count(),
      db.project.count(),
      db.mentor.count(),
      db.tutorial.count(),
      db.event.count(),
    ]);

  const countries = await db.profile.findMany({
    where: { country: { not: null } },
    select: { country: true },
    distinct: ["country"],
  });

  return NextResponse.json({
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
  });
}
