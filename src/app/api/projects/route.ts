import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { createProject, listProjects } from "@/lib/projects";
import { getSessionUserId } from "@/lib/session";

type CorpsProjet = Partial<{
  titre: unknown;
  description: unknown;
  stack: unknown;
  cherche: unknown;
  lien: unknown;
}>;

/** `stack`/`cherche` acceptés en tableau JSON ou en chaîne CSV (« Flutter,Dart »). */
function csvRecu(brut: unknown): string[] {
  if (Array.isArray(brut)) return brut.map((valeur) => String(valeur));
  if (typeof brut === "string") return brut.split(",");
  return [];
}

/** GET /api/projects — liste des projets, filtrable par `stack` et `q`. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projets = await listProjects({
      stack: url.searchParams.get("stack") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });
    return NextResponse.json({ projets });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

/** POST /api/projects — lancement d'un projet (session obligatoire). */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const corps = (await request.json().catch(() => null)) as CorpsProjet | null;
    const id = await createProject(userId, {
      titre: String(corps?.titre ?? ""),
      description: String(corps?.description ?? ""),
      stack: csvRecu(corps?.stack),
      cherche: csvRecu(corps?.cherche),
      lien: String(corps?.lien ?? ""),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
