import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;
  if (tag && tag !== "all") where.tags = { contains: tag };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
    ];
  }

  const threads = await db.thread.findMany({
    where,
    include: {
      author: { include: { profile: true } },
      _count: { select: { posts: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: threadBody, tags, category, authorId } = body;

    if (!title || !threadBody || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(title);

    const thread = await db.thread.create({
      data: {
        title,
        slug,
        body: threadBody,
        tags: tags || "",
        category: category || "general",
        authorId,
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    return NextResponse.json({ thread });
  } catch (e) {
    console.error("Create thread error:", e);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let slug = base;
  let i = 0;
  while (await db.thread.findUnique({ where: { slug } })) {
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}
