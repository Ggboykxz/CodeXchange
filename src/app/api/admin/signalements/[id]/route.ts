import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { resolveReport } from "@/lib/reports";

async function exigeAdmin(): Promise<number | null> {
  const userId = await getSessionUserId();
  if (userId === null) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN" ? userId : null;
}

type Contexte = { params: Promise<{ id: string }> };

/** POST /api/admin/signalements/[id] — { decision: "TRAITE" | "REJETE" }. */
export async function POST(request: Request, { params }: Contexte) {
  const adminId = await exigeAdmin();
  if (adminId === null) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  try {
    const { id } = await params;
    const reportId = Number(id);
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Signalement introuvable." }, { status: 404 });
    }
    const body = (await request.json().catch(() => null)) as { decision?: unknown } | null;
    const decision = body?.decision;
    if (decision !== "TRAITE" && decision !== "REJETE") {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Décision invalide." }, { status: 422 });
    }
    const modifies = await resolveReport(reportId, adminId, decision);
    return NextResponse.json({ modifies });
  } catch {
    return NextResponse.json({ error: "INTERNAL", message: "Une erreur interne est survenue." }, { status: 500 });
  }
}
