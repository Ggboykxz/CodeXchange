import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { voteSchema } from "@/lib/validate";

/**
 * Barème du cahier des charges §3.2 :
 *   +2 pour une réponse votée, -1 pour une question mal votée.
 * Le +10 de « réponse acceptée » est géré par PATCH /api/posts/[id].
 *
 * IMPORTANT : ces points reviennent à l'AUTEUR du contenu voté, jamais au
 * votant. Une version précédente incrémentait `user.reputation` sur
 * `user.id` — c'est-à-dire la réputation du votant, qui pouvait donc
 * s'auto-enrichir en votant partout.
 */
const REPUTATION = {
  answerVoted: 2,
  questionDownvoted: -1,
  acceptedAnswer: 10, // rappel, appliqué dans /api/posts/[id]
} as const;

/** Compteur dénormalisé à recalculer après chaque mutation de vote. */
async function recount(kind: "thread" | "post", refId: string) {
  // `_count` sur le filtre value:1 = nombre net d'upvotes.
  const agg = await db.vote.aggregate({
    where: { kind, refId, value: 1 },
    _count: { _all: true },
  });
  const upvotes = agg._count._all;

  if (kind === "thread") {
    await db.thread.updateMany({ where: { id: refId }, data: { upvotes } });
  } else {
    await db.post.updateMany({ where: { id: refId }, data: { upvotes } });
  }
  return upvotes;
}

/**
 * Applique le delta de réputation à l'auteur du contenu.
 *
 * `previous` / `next` sont les valeurs du vote (1, -1 ou 0). Toute
 * transition est couverte : poser, annuler, basculer de +1 à -1.
 *
 * On ne plafonne PAS à 0 : un plancher rendrait les deltas non réciproques.
 * Exemple concret — question à réputation 0, un votant met -1 (bloqué à 0),
 * puis annule son vote : +1 → l'auteur se retrouve à 1 point pour une
 * question sanctionnée puis rétablie. La réputation est donc la somme pure
 * des événements, ce qui garde `annuler == ne jamais avoir voté`.
 */
async function applyReputation(
  target: "thread" | "post",
  authorId: string,
  previous: number,
  next: number
): Promise<void> {
  if (previous === next) return;

  let delta: number;
  if (target === "post") {
    // Linéaire : chaque point de vote vaut 2 points de réputation.
    delta = REPUTATION.answerVoted * (next - previous);
  } else {
    // Seule la sanction existe : +1 sur une question ne rapporte pas.
    if (next === -1 && previous !== -1) delta = REPUTATION.questionDownvoted;
    else if (next !== -1 && previous === -1) delta = -REPUTATION.questionDownvoted;
    else return;
  }
  if (delta === 0) return;

  await db.user.update({
    where: { id: authorId },
    data: { reputation: { increment: delta } },
  });
}

/**
 * POST /api/votes — voter +1 / -1 (0 = annuler) sur une question ou une réponse.
 *
 * L'identité vient de la session serveur, jamais du body : le paramètre
 * historique `userId` client permettait de voter à la place de n'importe qui.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const limited = rateLimit(
      `vote:${user.id}`,
      WRITE_POLICY.limit,
      WRITE_POLICY.windowMs
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many votes. Slow down." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = voteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vote payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { target, targetId, value } = parsed.data;

    // La cible doit exister — sinon un vote créerait un compteur fantôme.
    let authorId: string;
    if (target === "thread") {
      const exists = await db.thread.findUnique({ where: { id: targetId } });
      if (!exists) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      authorId = exists.authorId;
    } else {
      const post = await db.post.findUnique({ where: { id: targetId } });
      if (!post) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
      authorId = post.authorId;
    }

    // On ne vote jamais sur son propre contenu : sinon un auteur pourrait
    // fabriquer sa propre réputation (et s'auto-pénaliser par ailleurs).
    if (authorId === user.id && value !== 0) {
      return NextResponse.json(
        {
          error:
            target === "thread"
              ? "You cannot vote on your own question"
              : "You cannot vote on your own answer",
        },
        { status: 422 }
      );
    }

    const existing = await db.vote.findUnique({
      where: { userId_kind_refId: { userId: user.id, kind: target, refId: targetId } },
    });
    const previous = existing?.value ?? 0;

    if (value === 0) {
      if (existing) {
        await db.vote.delete({ where: { id: existing.id } });
        // Le vote était +1 ou -1 : on rend à l'auteur ce qu'il avait pris.
        await applyReputation(target, authorId, previous, 0);
      }
      const upvotes = await recount(target, targetId);
      return NextResponse.json({ value: 0, upvotes });
    }

    if (existing) {
      await db.vote.update({ where: { id: existing.id }, data: { value } });
    } else {
      await db.vote.create({
        data: { userId: user.id, kind: target, refId: targetId, value },
      });
    }

    // Réputation de l'AUTEUR du contenu — cf. avertissement en tête de fichier.
    await applyReputation(target, authorId, previous, value);

    const upvotes = await recount(target, targetId);
    return NextResponse.json({ value, upvotes });
  } catch (e) {
    console.error("Vote error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
