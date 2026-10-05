import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const thread = await db.thread.findUnique({
    where: { slug },
    include: {
      author: { include: { profile: true } },
      posts: {
        include: { author: { include: { profile: true } } },
        orderBy: [{ isAnswer: "desc" }, { upvotes: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!thread) {
    return json({ error: "Thread not found" }, { status: 404 });
  }

  // Increment views (fire-and-forget)
  await db.thread.update({
    where: { id: thread.id },
    data: { views: { increment: 1 } },
  });

  return json({ thread });
}
