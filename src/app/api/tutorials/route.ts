import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { pagination, readMinutes, tutorialCreateSchema } from "@/lib/validate";
import { uniqueSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.trim();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    }

    const [tutorials, total] = await Promise.all([
      db.tutorial.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.tutorial.count({ where }),
    ]);

    return NextResponse.json({
      tutorials,
      total,
      limit,
      hasMore: skip + tutorials.length < total,
    });
  } catch (e) {
    console.error("List tutorials error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list tutorials" }, { status: 500 });
  }
}

/**
 * POST /api/tutorials — écrire un tuto (G).
 *
 * `readTime` n'est pas un champ du formulaire : il est **calculé** depuis le
 * corps du texte, sinon le badge « 5 min » finirait par mentir.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("Sign in to write a tutorial");

    const limited = rateLimit(`tuto:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many tutorials. Slow down.", limited.retryAfterSec);

    const parsed = tutorialCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid tutorial payload", parsed.error.flatten().fieldErrors);
    }

    const { body, ...rest } = parsed.data;
    const slug = await uniqueSlug("tutorial", parsed.data.title, "tuto");
    const tutorial = await db.tutorial.create({
      data: {
        ...rest,
        body,
        slug,
        // Calculé à l'écriture : cf. `readMinutes` (jamais saisi par l'auteur).
        readTime: readMinutes(body),
        authorId: user.id,
      },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ tutorial }, { status: 201 });
  } catch (e) {
    console.error("Create tutorial error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to publish tutorial" }, { status: 500 });
  }
}
