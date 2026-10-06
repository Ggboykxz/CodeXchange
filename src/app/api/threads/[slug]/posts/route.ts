import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { postCreateSchema } from "@/lib/validate";

const authorSelect = { id: true, name: true, image: true, profile: true } as const;

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

    const post = await db.post.create({
      data: { threadId: thread.id, authorId: user.id, body: parsed.data.body },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    console.error("Create post error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
