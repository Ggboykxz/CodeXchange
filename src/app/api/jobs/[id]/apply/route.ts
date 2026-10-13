import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId } from "@/lib/forum";
import { applyToJob, getJob } from "@/lib/jobs";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Offre introuvable." } as const;

/** POST /api/jobs/[id]/apply — postulation unique : compteur, ou 409 sur doublon. */
export async function POST(_request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const { id } = await params;
    const jobId = parseId(id);
    if (jobId === null) return NextResponse.json(INCONNU, { status: 404 });

    const offre = await getJob(jobId);
    if (!offre) return NextResponse.json(INCONNU, { status: 404 });

    const candidatures = await applyToJob(jobId, userId);
    return NextResponse.json({ candidatures });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
