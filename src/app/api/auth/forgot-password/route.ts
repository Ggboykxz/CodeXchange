import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

/** POST /api/auth/forgot-password { email } — envoie un lien si le compte existe. */
export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  const cleanEmail = (email ?? "").trim().toLowerCase();
  const user = cleanEmail ? await prisma.user.findUnique({ where: { email: cleanEmail } }) : null;

  if (user) {
    const brut = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(brut).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordResetToken.create({
      data: { tokenHash: hash, userId: user.id, expiresAt },
    });

    const lien = `${process.env.APP_URL ?? ""}/reinitialisation?token=${brut}`;
    const html = `<p>Bonjour ${user.nom},</p><p>Clique sur ce lien pour choisir un nouveau mot de passe (valide 1h) :</p><p><a href="${lien}">${lien}</a></p>`;
    await sendEmail(user.email, "Réinitialise ton mot de passe CodeXchange", html).catch(() => {});
    if (!process.env.RESEND_API_KEY && !process.env.SMTP_URL) console.log("[reset]", lien);
  }

  // On répond toujours ok pour ne pas révéler l'existence du compte.
  return NextResponse.json({ ok: true });
}
