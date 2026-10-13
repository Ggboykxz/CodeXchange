import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { banUser } from "@/lib/reports";
import { parseId } from "@/lib/forum";

async function exigeAdmin(): Promise<number | null> {
  const userId = await getSessionUserId();
  if (userId === null) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN" ? userId : null;
}

type Contexte = { params: Promise<{ id: string }> };

/** POST /api/admin/membres/[id]/bannir — suspend le compte et tue ses sessions. */
export async function POST(_request: Request, { params }: Contexte) {
  const adminId = await exigeAdmin();
  if (adminId === null) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  const { id } = await params;
  const targetId = parseId(id);
  if (targetId === null) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Membre introuvable." }, { status: 404 });
  }
  if (targetId === adminId) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Vous ne pouvez pas vous bannir vous-même." }, { status: 403 });
  }
  await banUser(targetId);
  return NextResponse.json({ ok: true, banni: true });
}
