import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, rateLimited } from "@/lib/api";
import { canManage, currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { jobUpdateSchema } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/jobs/[id] — corriger sa propre offre (ou celle d'autrui pour
 * l'équipe de modération). Chaque champ absent reste intact en base.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const job = await db.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!canManage(job.authorId, user)) {
      return NextResponse.json({ error: "You can only edit your own offer" }, { status: 403 });
    }

    const parsed = jobUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten().fieldErrors);
    }

    const updated = await db.job.update({
      where: { id },
      data: parsed.data,
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ job: updated });
  } catch (e) {
    console.error("Update job error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

/** DELETE /api/jobs/[id] — retrait d'une offre par son auteur ou l'équipe. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const job = await db.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!canManage(job.authorId, user)) {
      return NextResponse.json({ error: "You can only delete your own offer" }, { status: 403 });
    }

    const limited = rateLimit(`job-del:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many requests. Slow down.", limited.retryAfterSec);

    await db.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete job error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
