import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listMembers } from "@/lib/members";

/**
 * GET /api/members — annuaire des membres publics, filtrable par `pays`,
 * `stack` et `q` en query string. Aucune route POST : l'inscription passe par
 * `/api/auth/register` (Task 3).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const membres = await listMembers({
      pays: url.searchParams.get("pays") ?? undefined,
      stack: url.searchParams.get("stack") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });
    return NextResponse.json({ membres });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
