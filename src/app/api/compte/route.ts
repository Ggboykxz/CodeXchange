import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";


const schemaProfil = z.object({
  nom: z.string().trim().min(2).max(80).optional(),
  titre: z.string().trim().min(2).max(80).optional(),
  ville: z.string().trim().min(2).max(80).optional(),
  pays: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  stack: z.string().trim().max(200).optional(),
  github: z.string().trim().max(120).optional(),
  linkedin: z.string().trim().max(120).optional(),
  site: z.string().trim().max(120).optional(),
  notifEmail: z.boolean().optional(),
});

const schemaSecurite = z.object({
  motDePasseActuel: z.string().min(1),
  nouveauMotDePasse: z.string().min(8).max(72),
});

/** PATCH /api/compte — mise à jour de profil OU changement de mot de passe. */
export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Non connecté." }, { status: 401 });
  }

  const corps = await request.json().catch(() => null);
  if (!corps) return NextResponse.json({ error: "VALIDATION", message: "Corps manquant." }, { status: 400 });

  // Mode sécurité : changement de mot de passe
  if (typeof corps.nouveauMotDePasse === "string") {
    const resultat = schemaSecurite.safeParse(corps);
    if (!resultat.success) {
      return NextResponse.json({ error: "VALIDATION", message: "Données invalides." }, { status: 400 });
    }
    const membre = await prisma.user.findUnique({ where: { id: userId } });
    if (!membre) return NextResponse.json({ error: "NOT_FOUND", message: "Utilisateur introuvable." }, { status: 404 });

    const ok = await verifyPassword(resultat.data.motDePasseActuel, membre.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "INVALID_PASSWORD", message: "Mot de passe actuel incorrect." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(resultat.data.nouveauMotDePasse) },
    });
    return NextResponse.json({ ok: true, passwordChanged: true });
  }

  // Mode profil
  const resultat = schemaProfil.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ error: "VALIDATION", message: "Données invalides." }, { status: 400 });
  }
  const user = await prisma.user.update({ where: { id: userId }, data: resultat.data });
  return NextResponse.json({ ok: true, user: { id: user.id, nom: user.nom, slug: user.slug } });
}

/** DELETE /api/compte — suppression définitive du compte. */
export async function DELETE() {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Non connecté." }, { status: 401 });
  }
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
