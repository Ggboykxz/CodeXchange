import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { searchCodeXchange } from "@/lib/search";

/** GET /api/recherche?q=… — recherche globale publique (aucune session requise). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const resultat = await searchCodeXchange(q);
    const total =
      resultat.sujets.length +
      resultat.offres.length +
      resultat.projets.length +
      resultat.membres.length +
      resultat.tutos.length;
    return NextResponse.json({ ...resultat, total });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}