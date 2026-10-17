import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listJobs } from "@/lib/jobs";

/**
 * GET /api/jobs/liste — offres en JSON pur, servies par le composant client
 * JobsFeed pour le défilement infini (mêmes filtres et même `pageSize` que la
 * page 1 côté serveur).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageBrut = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageBrut) && pageBrut > 0 ? pageBrut : 1;
    const remote = url.searchParams.get("remote");
    const tri = url.searchParams.get("tri") === "populaire" ? "populaire" : "recent";

    const resultat = await listJobs({
      q: url.searchParams.get("q") ?? undefined,
      pays: url.searchParams.get("pays") ?? undefined,
      contrat: url.searchParams.get("contrat") ?? undefined,
      remote: remote === "1" ? true : remote === "0" ? false : undefined,
      tri,
      page,
      pageSize: 6,
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
