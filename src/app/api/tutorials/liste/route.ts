import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listTutorials } from "@/lib/tutorials";

/**
 * GET /api/tutorials/liste — page de tutos en JSON pur, servie par le
 * composant client TutosFeed pour le défilement infini (même fonction et
 * même `pageSize` que la page 1 côté serveur).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageBrut = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageBrut) && pageBrut > 0 ? pageBrut : 1;

    const resultat = await listTutorials({ page, pageSize: 5 });
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
