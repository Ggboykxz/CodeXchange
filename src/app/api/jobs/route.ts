import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { createJob, listJobs } from "@/lib/jobs";
import { getSessionUserId } from "@/lib/session";

type CorpsOffre = Partial<{
  titre: unknown;
  entreprise: unknown;
  contrat: unknown;
  remote: unknown;
  pays: unknown;
  ville: unknown;
  lien: unknown;
}>;

/** `remote` accepté en booléen JSON (`true`) ou en chaîne de query string (« 1 »). */
function remoteRecu(brut: unknown): boolean {
  return brut === true || brut === "1" || brut === "true" || brut === 1;
}

/** GET /api/jobs — liste des offres, filtrable par `remote`, `pays`, `contrat`, `q`. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const remote = url.searchParams.get("remote");
    const offres = await listJobs({
      remote: remote === null ? undefined : remoteRecu(remote),
      pays: url.searchParams.get("pays") ?? undefined,
      contrat: url.searchParams.get("contrat") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });
    return NextResponse.json({ offres });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

/** POST /api/jobs — publication d'une offre (session obligatoire). */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const corps = (await request.json().catch(() => null)) as CorpsOffre | null;
    const id = await createJob(userId, {
      titre: String(corps?.titre ?? ""),
      entreprise: String(corps?.entreprise ?? ""),
      contrat: String(corps?.contrat ?? ""),
      remote: remoteRecu(corps?.remote),
      pays: String(corps?.pays ?? ""),
      ville: String(corps?.ville ?? ""),
      lien: String(corps?.lien ?? ""),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
