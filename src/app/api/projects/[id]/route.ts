import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { parseId } from "@/lib/forum";
import { estMembre, getProject } from "@/lib/projects";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Projet introuvable." } as const;

/** GET /api/projects/[id] — projet complet (auteur, cherche, membres) + `membre`. */
export async function GET(_request: Request, { params }: Contexte) {
  try {
    const { id } = await params;
    const projectId = parseId(id);
    const projet = projectId === null ? null : await getProject(projectId);
    if (!projet || projectId === null) {
      return NextResponse.json(INCONNU, { status: 404 });
    }

    const userId = await getSessionUserId();
    const membre =
      userId !== null && (projet.authorId === userId || (await estMembre(userId, projectId)));
    return NextResponse.json({ projet, membre });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
