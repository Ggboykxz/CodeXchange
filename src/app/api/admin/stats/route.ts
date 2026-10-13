import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getAdminStats } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN", message: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  return NextResponse.json(await getAdminStats());
}
