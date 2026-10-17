import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listProjects } from "@/lib/projects";

/**
 * GET /api/projects/liste — projets en JSON pur, servis par le composant
 * client ProjetsFeed pour le défilement infini (mêmes filtres et même
 * `pageSize` que la page 1 côté serveur).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageBrut = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageBrut) && pageBrut > 0 ? pageBrut : 1;

    const resultat = await listProjects({
      q: url.searchParams.get("q") ?? undefined,
      stack: url.searchParams.get("stack") ?? undefined,
      page,
      pageSize: 5,
    });
    return NextResponse.json({
      items: resultat.items,
      page: resultat.page,
      totalPages: resultat.totalPages,
      total: resultat.total,
    });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
