import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { listReports } from "@/lib/reports";

async function exigeAdmin(): Promise<number | null> {
  const userId = await getSessionUserId();
  if (userId === null) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN" ? userId : null;
}

/** GET /api/admin/signalements — liste des signalements (admin). */
export async function GET() {
  const adminId = await exigeAdmin();
  if (adminId === null) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  return NextResponse.json(await listReports());
}
