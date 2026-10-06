import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { voteSchema } from "@/lib/validate";

/** Points attribués (cf. cahier des charges §3.2). */
const REPUTATION = {
  acceptedAnswer: 10,
  answerUpvoted: 2,
  questionDownvoted: -1,
} as const;

/** Compteur dénormalisé à recalculer après chaque mutation de vote. */
async function recount(kind: "thread" | "post", refId: string) {
  const agg = await db.vote.aggregate({
    where: { kind, refId, value: 1 },
    _sum: { value: true },
    _count: true,
  });
  const upvotes = agg._count;

  if (kind === "thread") {
    await db.thread.updateMany({ where: { id: refId }, data: { upvotes } });
  } else {
    await db.post.updateMany({ where: { id: refId }, data: { upvotes } });
  }
  return upvotes;
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
    if (target === "thread") {
      const exists = await db.thread.findUnique({ where: { id: targetId } });
      if (!exists) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      // On ne vote pas sa propre question (règle anti-auto-upvote).
      if (exists.authorId === user.id && value === 1) {
        return NextResponse.json(
          { error: "You cannot upvote your own question" },
          { status: 422 }
        );
      }
    } else {
      const post = await db.post.findUnique({ where: { id: targetId } });
      if (!post) return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      if (post.authorId === user.id && value === 1) {
        return NextResponse.json(
          { error: "You cannot upvote your own answer" },
          { status: 422 }
        );
      }
    }

    const where = { userId: user.id, kind: target, refId: targetId };
    const existing = await db.vote.findUnique({
      where: { userId_kind_refId: where },
    });

    if (value === 0) {
      if (existing) {
        await db.vote.delete({ where: { id: existing.id } });
        // La réputation redescend si on retire un upvote qui en avait donné.
        if (existing.value === 1) {
          const delta =
            target === "post" ? -REPUTATION.answerUpvoted : target === "thread" ? 0 : 0;
          if (delta !== 0) {
            await db.user.update({
              where: { id: user.id },
              data: { reputation: { increment: delta } },
            });
          }
        }
      }
      const upvotes = await recount(target, targetId);
      return NextResponse.json({ value: 0, upvotes });
    }

    const previous = existing?.value ?? 0;

    if (existing) {
      await db.vote.update({ where: { id: existing.id }, data: { value } });
    } else {
      await db.vote.create({ data: { userId: user.id, kind: target, refId: targetId, value } });
    }

    // Réputation : uniquement sur les réponses (cf. backlog EPIC F pour le reste).
    if (target === "post") {
      const gained =
        value === 1 && previous !== 1
          ? REPUTATION.answerUpvoted
          : value === -1 && previous === 1
            ? -REPUTATION.answerUpvoted
            : 0;
      if (gained !== 0) {
        await db.user.update({
          where: { id: user.id },
          data: { reputation: { increment: gained } },
        });
      }
    }

    const upvotes = await recount(target, targetId);
    return NextResponse.json({ value, upvotes });
  } catch (e) {
    console.error("Vote error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
