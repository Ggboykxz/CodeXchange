import { logger } from "@/lib/log";
import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, rateLimited } from "@/lib/api";
import { canManage, currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { projectUpdateSchema } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/projects/[id] — corriger son projet (ou le modérer). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!canManage(project.authorId, user)) {
      return NextResponse.json({ error: "You can only edit your own project" }, { status: 403 });
    }

    const parsed = projectUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid project payload", parsed.error.flatten().fieldErrors);
    }

    const updated = await db.project.update({
      where: { id },
      data: parsed.data,
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ project: updated });
  } catch (e) {
    logger.route("Update project error", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

/** DELETE /api/projects/[id] — retrait par l'auteur ou l'équipe. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!canManage(project.authorId, user)) {
      return NextResponse.json({ error: "You can only delete your own project" }, { status: 403 });
    }

    const limited = rateLimit(
      `project-del:${user.id}`,
      WRITE_POLICY.limit,
      WRITE_POLICY.windowMs
    );
    if (!limited.ok) return rateLimited("Too many requests. Slow down.", limited.retryAfterSec);

    await db.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Delete project error", e);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
