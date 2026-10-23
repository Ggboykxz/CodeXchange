import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { searchCodeXchange } from "@/lib/search";
import { rateLimitAsync } from "@/lib/rate-limit";

/**
 * GET /api/recherche?q=… — recherche globale publique (aucune session requise).
 * Rate-limited à 30 req/min par IP pour éviter scraping/DoS.
 * En test (NODE_ENV=test), le rate limiting est désactivé.
 */
export async function GET(request: Request) {
  try {
    // Rate limiting par IP (publique, donc pas de session)
    // Désactivé en environnement de test
    if (process.env.NODE_ENV !== "test") {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? request.headers.get("x-real-ip")
        ?? "unknown";
      const limite = await rateLimitAsync(`search:ip:${ip}`, 30, 60 * 1000);
      if (!limite.ok) {
        return NextResponse.json(
          { error: "RATE_LIMITED", message: "Trop de recherches. Patientez une minute." },
          { status: 429, headers: { "Retry-After": String(limite.retryAfter) } },
        );
      }
    }

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