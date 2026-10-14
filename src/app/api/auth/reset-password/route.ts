import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(72) });

/** POST /api/auth/reset-password { token, password } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const resultat = schema.safeParse(body);
  if (!resultat.success) {
    return NextResponse.json({ error: "VALIDATION", message: "Données invalides." }, { status: 400 });
  }
  const hash = crypto.createHash("sha256").update(resultat.data.token).digest("hex");
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } });

  if (
    !token ||
    token.usedAt ||
    token.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "INVALID_TOKEN", message: "Lien invalide ou expiré." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hashPassword(resultat.data.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: token.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
