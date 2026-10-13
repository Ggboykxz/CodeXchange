import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { adminDeleteReply } from "@/lib/admin";
import { parseId } from "@/lib/forum";

type Contexte = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Contexte) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN", message: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  const { id } = await params;
  const replyId = parseId(id);
  if (replyId === null) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Réponse introuvable." }, { status: 404 });
  }
  await adminDeleteReply(replyId);
  return NextResponse.json({ ok: true });
}
