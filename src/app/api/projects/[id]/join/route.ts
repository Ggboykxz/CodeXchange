import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId } from "@/lib/forum";
import { getProject, joinProject } from "@/lib/projects";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Projet introuvable." } as const;

/** POST /api/projects/[id]/join — rejoindre un projet (idempotent) : compteur de membres. */
export async function POST(_request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const { id } = await params;
    const projectId = parseId(id);
    if (projectId === null) return NextResponse.json(INCONNU, { status: 404 });

    const projet = await getProject(projectId);
    if (!projet) return NextResponse.json(INCONNU, { status: 404 });

    const membres = await joinProject(projectId, userId);
    return NextResponse.json({ membres });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
