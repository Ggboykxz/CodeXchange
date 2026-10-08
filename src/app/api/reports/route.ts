import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, isStaff, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { reportCreateSchema } from "@/lib/validate";
import { logger } from "@/lib/log";

/**
 * POST /api/reports — un membre signale un contenu (fil, réponse, offre,
 * projet, tuto, événement, message, profil). La cible est polymorphique :
 * `targetType` + `targetId`. Un même membre ne peut pas signaler deux
 * fois la même cible (doublon → 409). Rate-limit WRITE_POLICY.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const limited = rateLimit(`report:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) {
      return rateLimited("Too many reports. Slow down.", limited.retryAfterSec);
    }

    const parsed = reportCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid report payload", parsed.error.flatten().fieldErrors);
    }
    const { targetType, targetId, reason, details } = parsed.data;

    // La cible doit exister — on vérifie selon son type.
    const exists = await targetExists(targetType, targetId);
    if (!exists) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // Un membre ne peut pas signaler deux fois la même cible.
    const duplicate = await db.report.findFirst({
      where: { reporterId: user.id, targetType, targetId },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "You already reported this content" },
        { status: 409 }
      );
    }

    const report = await db.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        details: details ?? null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (e) {
    logger.route("Create report error", e);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

/**
 * GET /api/reports — liste des signalements (staff seulement), filtrable
 * par statut (`pending` | `resolved` | `dismissed`). Pagination bornée.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff only" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "pending";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));

    const where = status === "all" ? {} : { status };
    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reporter: { select: { id: true, name: true, profile: { select: { username: true } } } },
          resolvedBy: { select: { id: true, name: true } },
        },
      }),
      db.report.count({ where }),
    ]);

    return NextResponse.json({ reports, total, page, pageSize });
  } catch (e) {
    logger.route("List reports error", e);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

/** Vérifie qu'une cible polymorphique existe, selon son type. */
async function targetExists(targetType: string, targetId: string): Promise<boolean> {
  switch (targetType) {
    case "thread":
      return (await db.thread.findUnique({ where: { id: targetId } })) !== null;
    case "post":
      return (await db.post.findUnique({ where: { id: targetId } })) !== null;
    case "job":
      return (await db.job.findUnique({ where: { id: targetId } })) !== null;
    case "project":
      return (await db.project.findUnique({ where: { id: targetId } })) !== null;
    case "tutorial":
      return (await db.tutorial.findUnique({ where: { id: targetId } })) !== null;
    case "event":
      return (await db.event.findUnique({ where: { id: targetId } })) !== null;
    case "message":
      return (await db.message.findUnique({ where: { id: targetId } })) !== null;
    case "profile":
      return (await db.profile.findUnique({ where: { id: targetId } })) !== null;
    default:
      return false;
  }
}
