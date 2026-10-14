import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.user.findFirst({ select: { id: true } });
    const compte = await prisma.user.count();
    return NextResponse.json({ ok: true, utilisateurs: compte });
  } catch (erreur) {
    return NextResponse.json(
      { ok: false, erreur: erreur instanceof Error ? erreur.message : String(erreur) },
      { status: 500 },
    );
  }
}
