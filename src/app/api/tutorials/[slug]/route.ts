import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, rateLimited } from "@/lib/api";
import { canManage, currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { readMinutes, tutorialUpdateSchema } from "@/lib/validate";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Le segment s'appelle `slug` parce que c'est lui qui s'affiche dans l'URL
 * (`#tutos/mon-tuto`), mais on accepte aussi un id : le lien d'édition d'un
 * auteur part de son id, et les deux identifiants sont uniques.
 *
 * On ne peut pas avoir `[slug]` ET `[id]` au même niveau dans Next — d'où
 * ce `findFirst` sur les deux clés.
 */
async function findTuto(key: string) {
  return db.tutorial.findFirst({
    where: { OR: [{ slug: key }, { id: key }] },
    include: { author: { select: authorSelect } },
  });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const tutorial = await findTuto(slug);

    if (!tutorial) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    return NextResponse.json({ tutorial });
  } catch (e) {
    console.error("Get tutorial error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to load tutorial" }, { status: 500 });
  }
}

/** PATCH — corriger son tuto ; `readTime` est recalculé si le corps change. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { slug } = await params;
    const tutorial = await findTuto(slug);
    if (!tutorial) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }
    if (!canManage(tutorial.authorId, user)) {
      return NextResponse.json({ error: "You can only edit your own tutorial" }, { status: 403 });
    }

    const parsed = tutorialUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid tutorial payload", parsed.error.flatten().fieldErrors);
    }

    const updated = await db.tutorial.update({
      where: { id: tutorial.id },
      data: {
        ...parsed.data,
        ...(parsed.data.body ? { readTime: readMinutes(parsed.data.body) } : null),
      },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ tutorial: updated });
  } catch (e) {
    console.error("Update tutorial error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to update tutorial" }, { status: 500 });
  }
}

/** DELETE — retrait par l'auteur ou l'équipe. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { slug } = await params;
    const tutorial = await findTuto(slug);
    if (!tutorial) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }
    if (!canManage(tutorial.authorId, user)) {
      return NextResponse.json(
        { error: "You can only delete your own tutorial" },
        { status: 403 }
      );
    }

    const limited = rateLimit(`tuto-del:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many requests. Slow down.", limited.retryAfterSec);

    await db.tutorial.delete({ where: { id: tutorial.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete tutorial error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to delete tutorial" }, { status: 500 });
  }
}
