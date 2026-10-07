import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { pagination, projectCreateSchema } from "@/lib/validate";
import { uniqueSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const stack = searchParams.get("stack");
    const q = searchParams.get("q")?.trim();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (stack && stack !== "all") where.stack = { contains: stack, mode: "insensitive" };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { tagline: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { stack: { contains: q, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: [{ stars: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip,
      }),
      db.project.count({ where }),
    ]);

    return NextResponse.json({ projects, total, limit, hasMore: skip + projects.length < total });
  } catch (e) {
    console.error("List projects error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

/**
 * POST /api/projects — proposer un projet (G).
 * Le slug est dérivé du nom puis rendu unique : deux « Kora » coexistent.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("Sign in to share a project");

    const limited = rateLimit(`project:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many projects. Slow down.", limited.retryAfterSec);

    const parsed = projectCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid project payload", parsed.error.flatten().fieldErrors);
    }

    const slug = await uniqueSlug("project", parsed.data.name, "projet");
    const project = await db.project.create({
      data: { ...parsed.data, slug, authorId: user.id },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    console.error("Create project error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to publish project" }, { status: 500 });
  }
}
