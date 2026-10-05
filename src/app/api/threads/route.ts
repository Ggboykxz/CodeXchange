import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { db } from "@/lib/db";
import { sessionUserId } from "@/lib/session";

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

  return json({ threads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: threadBody, tags, category } = body;

    // The author comes from the signed session cookie, never from the body.
    const authorId = sessionUserId(req);
    if (!authorId) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    if (!title || !threadBody) {
      return json(
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

    return json({ thread });
  } catch (e) {
    console.error("Create thread error:", e);
    return json(
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
