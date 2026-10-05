import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";
import { sessionUserId } from "@/lib/session";
import { notify } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { body: postBody, isAnswer } = body;

    const authorId = sessionUserId(req);
    if (!authorId) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    if (!postBody) {
      return json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const thread = await db.thread.findUnique({ where: { slug } });
    if (!thread) {
      return json({ error: "Thread not found" }, { status: 404 });
    }

    // Only the thread author can mark an answer as accepted.
    const accepted = Boolean(isAnswer) && thread.authorId === authorId;

    const post = await db.post.create({
      data: {
        threadId: thread.id,
        authorId,
        body: postBody,
        isAnswer: accepted,
      },
      include: { author: { include: { profile: true } } },
    });

    // Tell the thread author someone replied (never self-notifications).
    const actor = await db.user.findUnique({
      where: { id: authorId },
      select: { name: true },
    });
    await notify({
      recipientId: thread.authorId,
      actorId: authorId,
      type: "reply",
      title: `${actor?.name ?? "Un dev"} a répondu à ta discussion`,
      body: postBody.slice(0, 140),
      href: `#forum/${thread.slug}`,
    });

    return json({ post });
  } catch (e) {
    console.error("Create post error:", e);
    return json({ error: "Failed to create post" }, { status: 500 });
  }
}
