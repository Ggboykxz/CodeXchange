import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { body: postBody, authorId, isAnswer } = body;

    if (!postBody || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const thread = await db.thread.findUnique({ where: { slug } });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const post = await db.post.create({
      data: {
        threadId: thread.id,
        authorId,
        body: postBody,
        isAnswer: isAnswer || false,
      },
      include: { author: { include: { profile: true } } },
    });

    return NextResponse.json({ post });
  } catch (e) {
    console.error("Create post error:", e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
