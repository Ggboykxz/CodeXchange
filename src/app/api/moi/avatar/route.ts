import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";

const MAX_TAILLE = 500 * 1024; // 500 Ko
const MIME_AUTORISES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** POST /api/moi/avatar — { dataUrl } → enregistre l'avatar du membre connecté. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { dataUrl?: unknown };
    const dataUrl = String(body.dataUrl ?? "");
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Format d'image invalide (PNG, JPEG ou WebP)." }, { status: 422 });
    }
    const mime = match[1];
    if (!MIME_AUTORISES.has(mime)) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Type d'image non supporté." }, { status: 422 });
    }
    const base64 = match[2];
    if (base64.length > MAX_TAILLE * 1.4) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Image trop lourde (max 500 Ko)." }, { status: 422 });
    }

    await prisma.user.update({ where: { id: userId }, data: { avatar: dataUrl } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INTERNAL", message: "Une erreur interne est survenue." }, { status: 500 });
  }
}

/** DELETE /api/moi/avatar — supprime l'avatar. */
export async function DELETE() {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  await prisma.user.update({ where: { id: userId }, data: { avatar: "" } });
  return NextResponse.json({ ok: true });
}
