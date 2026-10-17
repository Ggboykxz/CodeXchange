import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listMembers } from "@/lib/members";

/**
 * GET /api/members/liste — membres publics en JSON pur, servis par le
 * composant client AnnuaireFeed pour le défilement infini (mêmes filtres et
 * même `pageSize` que la page 1 côté serveur).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageBrut = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageBrut) && pageBrut > 0 ? pageBrut : 1;

    const resultat = await listMembers({
      q: url.searchParams.get("q") ?? undefined,
      pays: url.searchParams.get("pays") ?? undefined,
      stack: url.searchParams.get("stack") ?? undefined,
      page,
      pageSize: 12,
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
