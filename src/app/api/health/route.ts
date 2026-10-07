import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — sonde de disponibilité pour Vercel / une balise externe.
 *
 * Renvoie 200 si l'app et la base répondent, 503 sinon. Les services
 * tarifier principal vérifient juste la connectivité REDIS? non : ici une
 * simple `SELECT 1` évite de charger la DB et suffit à valider le circuit.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "up",
      latencyMs: Date.now() - startedAt,
      uptimeSec: Math.floor(process.uptime()),
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: "down", latencyMs: Date.now() - startedAt },
      { status: 503 }
    );
  }
}
