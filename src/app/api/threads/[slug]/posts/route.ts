import { logger } from "@/lib/log";
import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { postCreateSchema } from "@/lib/validate";
import { notify } from "@/lib/notify";


/**
 * POST /api/threads/[slug]/posts — répondre à une question.
 *
 * L'auteur vient de la session ; `isAnswer` n'est plus lisible depuis le body
 * (sinon n'importe qui pouvait marquer sa réponse comme "meilleure réponse").
 * Le statut se pose via PATCH /api/posts/[id].
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to answer");

    const limited = rateLimit(`post:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many answers. Slow down." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const { slug } = await params;
    const parsed = postCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid answer payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const thread = await db.thread.findUnique({ where: { slug } });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Réponse à un commentaire : la cible doit appartenir à CETTE question,
    // sinon on pourrait imbriquer un fil dans un autre en devinant les ids.
    const parentId = parsed.data.parentId ?? null;
    let parentAuthorId: string | null = null;
    if (parentId) {
      const parent = await db.post.findUnique({
        where: { id: parentId },
        select: { id: true, threadId: true, authorId: true },
      });
      if (!parent || parent.threadId !== thread.id) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
      parentAuthorId = parent.authorId;
    }

    const post = await db.post.create({
      data: {
        threadId: thread.id,
        authorId: user.id,
        body: parsed.data.body,
        parentId,
      },
      include: { author: { select: authorSelect } },
    });

    // On notifie la personne à qui l'on répond (l'auteur du commentaire
    // parent), sinon l'auteur de la question — jamais soi-même : `notify`
    // le gère.
    notify({
      recipientId: parentAuthorId ?? thread.authorId,
      actorId: user.id,
      type: "reply",
      title: `${user.name} a répondu à « ${thread.title} »`,
      body: parsed.data.body.slice(0, 160),
      href: `/forum/${thread.slug}`,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    logger.route("Create post error", e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
