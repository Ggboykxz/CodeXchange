import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NON_CONNECTE } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

const MAX_TAGS = 20;
const RE_TAG = /^[\p{L}\p{N}_-]{1,40}$/u;

/**
 * POST /api/onboarding — abonne le membre connecté à une liste de tags
 * (centres d'intérêt choisis à l'inscription). Idempotent : les tags déjà
 * suivis sont ignorés, jamais de doublon.
 * Body : { tags: string[] }. Retour : { suivis: number }.
 */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
  }

  const corps = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const brut = Array.isArray(corps?.tags) ? corps.tags : [];
  // Nettoyage : déduplique, borne, valide chaque tag.
  const tags = [
    ...new Set(
      brut
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => RE_TAG.test(t))
        .slice(0, MAX_TAGS),
    ),
  ];
  if (tags.length === 0) return NextResponse.json({ suivis: 0 });

  // Abonnements existants pour ne pas re-craser.
  const existants = await prisma.tagFollow.findMany({
    where: { userId, tag: { in: tags } },
    select: { tag: true },
  });
  const dejaSuivis = new Set(existants.map((e) => e.tag));
  const nouveaux = tags.filter((t) => !dejaSuivis.has(t));

  if (nouveaux.length > 0) {
    await prisma.tagFollow.createMany({
      data: nouveaux.map((tag) => ({ userId, tag })),
    });
  }
  return NextResponse.json({ suivis: dejaSuivis.size + nouveaux.length });
}
