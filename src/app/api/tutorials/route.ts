import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listTutorials } from "@/lib/tutorials";

/**
 * GET /api/tutorials — liste des tutos (tags en tableau, auteur public).
 * Aucune route POST : les tutos sont rédigés hors ligne pour la démo
 * (`prisma/seed.ts`, Task 10).
 */
export async function GET() {
  try {
    const tutos = await listTutorials();
    return NextResponse.json({ tutos });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
