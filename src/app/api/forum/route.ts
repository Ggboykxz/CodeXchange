import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, createPost, listPosts } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type CorpsSujet = Partial<{
  titre: unknown;
  corps: unknown;
  tags: unknown;
}>;

/** Normalise les tags reçus : tableau JSON ou chaîne CSV (« flutter, gabon »). */
function tagsRecus(brut: unknown): string[] {
  if (Array.isArray(brut)) return brut.map((tag) => String(tag));
  return String(brut ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** GET /api/forum — liste des sujets, filtrable par `q` (recherche) et `tag`. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const tag = url.searchParams.get("tag") ?? undefined;
    const sujets = await listPosts({ q, tag });
    return NextResponse.json({ sujets });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

/** POST /api/forum — création d'un sujet (session obligatoire). */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const corps = (await request.json().catch(() => null)) as CorpsSujet & { sondage?: unknown } | null;
    const options = Array.isArray(corps?.sondage)
      ? (corps?.sondage as unknown[]).map((s) => String(s))
      : undefined;
    const id = await createPost(userId, {
      titre: String(corps?.titre ?? ""),
      corps: String(corps?.corps ?? ""),
      tags: tagsRecus(corps?.tags),
      sondage: options ? { options } : undefined,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
