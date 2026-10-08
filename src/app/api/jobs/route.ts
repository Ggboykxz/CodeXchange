import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { jobCreateSchema, pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const type = searchParams.get("type");
    const remote = searchParams.get("remote");
    const stack = searchParams.get("stack");
    const q = searchParams.get("q")?.trim();
    const currency = searchParams.get("currency")?.trim().toUpperCase();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (country && country !== "all") where.country = country;
    if (type && type !== "all") where.type = type;
    if (remote === "true") where.remote = true;
    if (stack && stack !== "all") where.stack = { contains: stack, mode: "insensitive" };
    // G5 — filtrer par devise : la chaîne salary contient toujours son
    // code (seed + normalisation client de la saisie), LIKE aveugle géne
    // un faux positif seulement sur des codes diamétralement improbables.
    if (currency && currency !== "ALL") {
      where.salary = { contains: currency, mode: "insensitive" };
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { stack: { contains: q, mode: "insensitive" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.job.count({ where }),
    ]);

    return NextResponse.json({ jobs, total, limit, hasMore: skip + jobs.length < total });
  } catch (e) {
    logger.route("List jobs error", e);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

/**
 * POST /api/jobs — publier une offre (G).
 *
 * `authorId` vient de la session serveur : un client qui l'envoie dans le
 * body ne peut pas publier au nom d'un autre.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("Sign in to publish a job offer");

    const limited = rateLimit(`job:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many offers. Slow down.", limited.retryAfterSec);

    const parsed = jobCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten().fieldErrors);
    }

    const job = await db.job.create({
      data: { ...parsed.data, authorId: user.id },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    logger.route("Create job error", e);
    return NextResponse.json({ error: "Failed to publish job" }, { status: 500 });
  }
}
