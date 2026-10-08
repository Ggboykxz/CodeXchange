import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest } from "@/lib/api";
import { currentUser, isStaff, unauthorized } from "@/lib/auth";
import { reportUpdateSchema } from "@/lib/validate";
import { logger } from "@/lib/log";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/reports/[id] — le staff résout ou rejette un signalement.
 * La décision est horodatée, tracée dans `ModerationLog`, et le
 * statut ne peut pas changer deux fois (idempotence).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff only" }, { status: 403 });
    }

    const { id } = await params;
    const report = await db.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (report.status !== "pending") {
      return NextResponse.json(
        { error: "Report already processed" },
        { status: 409 }
      );
    }

    const parsed = reportUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten().fieldErrors);
    }
    const { status, resolution } = parsed.data;
    if (status === "resolved" && !resolution?.trim()) {
      return badRequest("Resolution note is required when resolving");
    }

    const [updated] = await db.$transaction([
      db.report.update({
        where: { id },
        data: {
          status,
          resolution: resolution ?? null,
          resolvedById: user.id,
          resolvedAt: new Date(),
        },
      }),
      db.moderationLog.create({
        data: {
          actorId: user.id,
          action: status === "resolved" ? "resolve_report" : "dismiss_report",
          targetType: report.targetType,
          targetId: report.targetId,
          note: resolution ?? null,
        },
      }),
    ]);

    return NextResponse.json({ report: updated });
  } catch (e) {
    logger.route("Update report error", e);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

/**
 * DELETE /api/reports/[id] — suppression définitive d'un signalement
 * (admin seulement) : cas d'un signalement déposé par erreur ou
 * contenant des données sensibles. Le journal conserve la trace.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff only" }, { status: 403 });
    }

    const { id } = await params;
    const report = await db.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await db.report.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Delete report error", e);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
