import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pagination } from "@/lib/validate";


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

    // Incrémentation des vues : non bloquante. Le `await` précédent ajoutait
    // la latence d'écriture au chemin de lecture et faisait échouer tout le GET
    // si l'écriture échouait — alors que le commentaire disait "fire-and-forget".
    db.thread
      .update({ where: { id: thread.id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    return NextResponse.json({ thread });
  } catch (e) {
    console.error("Get thread error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}
