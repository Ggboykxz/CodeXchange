import { logger } from "@/lib/log";
import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pagination, threadUpdateSchema } from "@/lib/validate";
import { currentUser, unauthorized, canManage, isStaff } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { limit, skip } = pagination(new URL(req.url).searchParams, 50);

    const thread = await db.thread.findUnique({
      where: { slug },
      include: {
        author: { select: authorSelect },
        posts: {
          include: { author: { select: authorSelect } },
          orderBy: [{ isAnswer: "desc" }, { upvotes: "desc" }, { createdAt: "asc" }],
          take: limit,
          skip,
        },
        _count: { select: { posts: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Vote du visiteur connecté. Sans lui, l'UI ne saurait pas si ↑/↓ est
    // déjà enfoncé : chaque rechargement rendrait le vote à 0 visuellement
    // alors qu'il existe en base, et l'utilisateur cliquerait en croix.
    const viewer = await currentUser(req);
    let myThreadVote = 0;
    const myPostVotes = new Map<string, number>();
    if (viewer) {
      const rows = await db.vote.findMany({
        where: {
          userId: viewer.id,
          OR: [
            { kind: "thread", refId: thread.id },
            { kind: "post", refId: { in: thread.posts.map((p) => p.id) } },
          ],
        },
        select: { kind: true, refId: true, value: true },
      });
      for (const r of rows) {
        if (r.kind === "thread") myThreadVote = r.value;
        else myPostVotes.set(r.refId, r.value);
      }
    }

    // Incrémentation des vues : non bloquante. Le `await` précédent ajoutait
    // la latence d'écriture au chemin de lecture et faisait échouer tout le GET
    // si l'écriture échouait — alors que le commentaire disait "fire-and-forget".
    db.thread
      .update({ where: { id: thread.id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    return NextResponse.json({
      thread: {
        ...thread,
        myVote: myThreadVote,
        posts: thread.posts.map((p) => ({
          ...p,
          myVote: myPostVotes.get(p.id) ?? 0,
        })),
      },
    });
  } catch (e) {
    logger.route("Get thread error", e);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}

/**
 * Reddit limite à 2 questions épinglées par communauté — on transpose :
 * le forum ne met pas tout le monde en avant, sinon ça n'a plus de sens.
 */
const MAX_PINNED = 2;

/**
 * PATCH /api/threads/[slug] — éditer une question.
 *
 * Droits : l'auteur de la question OU le staff (`canManage`). Mais `pinned`
 * est réservé au staff — un auteur ne peut pas s'épingler tout seul en haut
 * du forum, sinon les 2 places seraient prises par les plus malins.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to edit");

    const limited = rateLimit(`thread:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many writes. Slow down." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const { slug } = await params;
    const thread = await db.thread.findUnique({ where: { slug } });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (!canManage(thread.authorId, user)) {
      return NextResponse.json({ error: "You can only edit your own threads" }, { status: 403 });
    }

    const parsed = threadUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.pinned !== undefined && !isStaff(user)) {
      return NextResponse.json({ error: "Only staff can pin" }, { status: 403 });
    }
    if (data.pinned === true) {
      const others = await db.thread.count({
        where: { pinned: true, NOT: { id: thread.id } },
      });
      if (others >= MAX_PINNED) {
        return NextResponse.json(
          { error: `At most ${MAX_PINNED} pinned threads` },
          { status: 400 }
        );
      }
    }

    const updated = await db.thread.update({
      where: { id: thread.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.solved !== undefined && { solved: data.solved }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
      },
    });

    // M1 — tracer l'épinglage dans le journal de modération.
    if (data.pinned !== undefined) {
      await db.moderationLog.create({
        data: {
          actorId: user.id,
          action: data.pinned ? "pin" : "unpin",
          targetType: "thread",
          targetId: thread.id,
        },
      });
    }

    return NextResponse.json({ thread: updated });
  } catch (e) {
    logger.route("Edit thread error", e);
    return NextResponse.json({ error: "Failed to edit thread" }, { status: 500 });
  }
}

/**
 * DELETE /api/threads/[slug] — supprimer une question (auteur ou staff).
 *
 * Les votes ne suivent **pas** de relation Prisma : ils sont liés par
 * `kind`/`refId`. Sans cette purge, supprimer une question laisserait des
 * votes orphelins (thread + réponses) qui fausseraient les compteurs de
 * réputation et les tris.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to delete");

    const { slug } = await params;
    const thread = await db.thread.findUnique({
      where: { slug },
      include: { posts: { select: { id: true } } },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (!canManage(thread.authorId, user)) {
      return NextResponse.json({ error: "You can only delete your own threads" }, { status: 403 });
    }

    const postIds = thread.posts.map((p) => p.id);
    await db.vote.deleteMany({
      where: {
        OR: [
          { kind: "thread", refId: thread.id },
          ...(postIds.length ? [{ kind: "post", refId: { in: postIds } }] : []),
        ],
      },
    });
    // `posts` part en cascade avec la question (onDelete: Cascade).
    await db.thread.delete({ where: { id: thread.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Delete thread error", e);
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
  }
}
