import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { notify } from "@/lib/notify";

const acceptSchema = z.object({
  isAnswer: z.boolean(),
});

/** Réputation : +10 pour l'auteur d'une réponse acceptée (§3.2 du CDC). */
const ACCEPTED_BONUS = 10;

/**
 * PATCH /api/posts/[id] — marquer / démarquer la meilleure réponse (C6).
 *
 * Seul l'auteur de la question ou un modérateur/admin peut le faire.
 * `isAnswer` est unique par question : on bascule en transaction.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const parsed = acceptSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id },
      include: { thread: { select: { id: true, authorId: true, solved: true } } },
    });
    if (!post) return NextResponse.json({ error: "Answer not found" }, { status: 404 });

    const isThreadOwner = post.thread.authorId === user.id;
    const isStaff = user.role === "admin" || user.role === "moderator";
    if (!isThreadOwner && !isStaff) {
      return NextResponse.json(
        { error: "Only the question author can accept an answer" },
        { status: 403 }
      );
    }

    const wantsAccept = parsed.data.isAnswer;

    await db.$transaction(async (tx) => {
      // Une seule meilleure réponse par question.
      if (wantsAccept) {
        const previous = await tx.post.findFirst({
          where: { threadId: post.threadId, isAnswer: true },
        });
        if (previous && previous.id !== post.id) {
          await tx.post.update({
            where: { id: previous.id },
            data: { isAnswer: false },
          });
          await tx.user.update({
            where: { id: previous.authorId },
            data: { reputation: { decrement: ACCEPTED_BONUS } },
          });
        }
      }

      await tx.post.update({ where: { id }, data: { isAnswer: wantsAccept } });

      // Réputation de l'auteur de la réponse.
      if (post.authorId !== post.thread.authorId) {
        await tx.user.update({
          where: { id: post.authorId },
          data: {
            reputation: { increment: wantsAccept ? ACCEPTED_BONUS : -ACCEPTED_BONUS },
          },
        });
      }

      // La question passe en "résolue" dès qu'une réponse est acceptée.
      await tx.thread.update({
        where: { id: post.threadId },
        data: { solved: wantsAccept },
      });
    });

    // Notifie l'auteur de la réponse (sauf s'il est aussi l'auteur de la
    // question — `notify` ignore déjà l'auto-notification).
    if (wantsAccept) {
      notify({
        recipientId: post.authorId,
        actorId: user.id,
        type: "answer",
        title: "Ta réponse a été acceptée",
        body: post.body.slice(0, 160),
        href: "#forum",
      });
    }

    const updated = await db.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, image: true, profile: true } } },
    });

    return NextResponse.json({ post: updated });
  } catch (e) {
    console.error("Accept answer error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to update answer" }, { status: 500 });
  }
}
