import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listPosts } from "@/lib/forum";

/**
 * GET /api/forum/sujets — page de sujets en JSON pur, servie par le composant
 * client ForumFeed pour le défilement infini (même fonction et mêmes filtres
 * que la page 1 côté serveur : `q`, `tag`, `tri`, `page`).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const tag = url.searchParams.get("tag") ?? undefined;
    const triBrut = url.searchParams.get("tri") ?? undefined;
    const tri =
      triBrut === "hot" || triBrut === "new" || triBrut === "top" || triBrut === "recent" || triBrut === "populaire"
        ? triBrut
        : undefined;
    const pageBrut = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageBrut) && pageBrut > 0 ? pageBrut : 1;

    const resultat = await listPosts({ q, tag, tri, page });
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
