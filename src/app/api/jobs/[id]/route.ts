import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { parseId } from "@/lib/forum";
import { aPostule, getJob } from "@/lib/jobs";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Offre introuvable." } as const;

/** GET /api/jobs/[id] — offre complète (auteur, candidatures) + `postule`. */
export async function GET(_request: Request, { params }: Contexte) {
  try {
    const { id } = await params;
    const jobId = parseId(id);
    const offre = jobId === null ? null : await getJob(jobId);
    if (!offre || jobId === null) {
      return NextResponse.json(INCONNU, { status: 404 });
    }

    const userId = await getSessionUserId();
    const postule = userId === null ? false : await aPostule(userId, jobId);
    return NextResponse.json({ offre, postule });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
