import { authorSelect } from "@/lib/selects";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { pagination, threadCreateSchema } from "@/lib/validate";
import { uniqueSlug } from "@/lib/slug";
import { parseSort, parseWindow, rankThreads, windowStart } from "@/lib/ranking";

/**
 * Candidats retenus pour les tris qui ne peuvent pas se faire côté SQL
 * (`hot`, `rising` : une formule avec vieillissement n'existe pas dans
 * l'ordre Prisma). Plafonné pour borner la mémoire ; au-delà, la page est
 * réputée vide — les deux tri chronologiques restent paginés en base.
 */
const RANK_CANDIDATES = 500;

/** Votes ↑ reçus pendant cette durée pour le tri `rising`. */
const RISING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/threads — liste + filtrage + recherche plein-texte + pagination.
 *
 * `select` explicite côté auteur : un `include: { author: true }` renverrait
 * `passwordHash` et `role`.
 *
 * Tris (cf. lib/ranking) : `hot` (défaut), `new`, `top` (+ `?t=` la fenêtre),
 * `active`, `rising`.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const q = searchParams.get("q")?.trim();
    const solved = searchParams.get("solved");
    const sort = parseSort(searchParams.get("sort"));
    const timeWindow = parseWindow(searchParams.get("t"));
    const { limit, skip } = pagination(searchParams, 20);

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (tag && tag !== "all") where.tags = { contains: tag, mode: "insensitive" };
    if (solved === "true") where.solved = true;
    if (solved === "false") where.solved = false;
    if (q) {
      // Recherche sur titre, corps ET tags (cf. cahier des charges §3.2).
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    }
    // `?t=` borne le tri `top`, exactement comme le sélecteur d'échéance de
    // Reddit (heure / jour / semaine / mois / année / tout).
    if (sort === "top") {
      const since = windowStart(timeWindow);
      if (since) where.createdAt = { gte: since };
    }

    // Les questions épinglées restent en tête quel que soit le tri (leur
    // classement est réappliqué dans `rankThreads` pour les tris calculés).
    const orderBy: Prisma.ThreadOrderByWithRelationInput[] =
      sort === "top"
        ? [{ pinned: "desc" }, { upvotes: "desc" }, { createdAt: "desc" }]
        : sort === "active"
        ? [{ pinned: "desc" }, { posts: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ pinned: "desc" }, { createdAt: "desc" }];

    const needsRanking = sort === "hot" || sort === "rising";

    const [rows, total, user] = await Promise.all([
      db.thread.findMany({
        where,
        include: {
          author: { select: authorSelect },
          _count: { select: { posts: true } },
        },
        orderBy: needsRanking ? [{ createdAt: "desc" }] : orderBy,
        take: needsRanking ? RANK_CANDIDATES : limit,
        skip: needsRanking ? 0 : skip,
      }),
      db.thread.count({ where }),
      currentUser(req),
    ]);

    let items = rows;
    let pageTotal = total;

    if (needsRanking) {
      // `rising` a besoin du nombre de votes **récents** : les votes sont
      // une table sans relation vers Thread, on les agrège donc à part.
      let recentVotes: Map<string, number> | undefined;
      if (sort === "rising") {
        const since = new Date(Date.now() - RISING_WINDOW_MS);
        const grouped = await db.vote.groupBy({
          by: ["refId"],
          where: {
            kind: "thread",
            value: 1,
            createdAt: { gte: since },
            refId: { in: rows.map((r) => r.id) },
          },
          _count: { _all: true },
        });
        recentVotes = new Map(grouped.map((g) => [g.refId, g._count._all]));
      }

      const ranked = rankThreads(
        rows.map((r) => ({
          id: r.id,
          pinned: r.pinned,
          upvotes: r.upvotes,
          createdAt: r.createdAt,
          comments: r._count.posts,
        })),
        sort,
        { recentVotes }
      );
      const position = new Map(ranked.map((r, i) => [r.id, i]));
      const ordered = [...rows].sort(
        (a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0)
      );
      items = ordered.slice(skip, skip + limit);
      // Au-delà du plafond de candidats, il n'y a plus de page suivante.
      pageTotal = Math.min(total, rows.length);
    }

    // `myVote` : sans lui, les flèches ↑↓ du fil ne savent pas si l'utilisateur
    // a déjà voté — une seule requête couvre toute la page.
    const myVotes = user
      ? await db.vote.findMany({
          where: {
            userId: user.id,
            kind: "thread",
            refId: { in: items.map((t) => t.id) },
          },
          select: { refId: true, value: true },
        })
      : [];
    const voteByRef = new Map(myVotes.map((v) => [v.refId, v.value]));
    const page = items.map((t) => ({ ...t, myVote: voteByRef.get(t.id) ?? 0 }));

    return NextResponse.json({
      threads: page,
      total,
      sort,
      page: Math.floor(skip / limit) + 1,
      limit,
      hasMore: skip + page.length < pageTotal,
    });
  } catch (e) {
    console.error("List threads error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to list threads" }, { status: 500 });
  }
}

/**
 * POST /api/threads — créer une question.
 *
 * `authorId` n'est plus accepté du client : il vient de la session serveur.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to ask a question");

    const limited = rateLimit(`thread:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many questions. Slow down." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = threadCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid question payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { title, body, tags, category } = parsed.data;

    const slug = await generateUniqueSlug(title);
    const thread = await db.thread.create({
      data: { title, slug, body, tags, category, authorId: user.id },
      include: {
        author: { select: authorSelect },
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (e) {
    console.error("Create thread error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}

/**
 * Slug : base courte + suffixe aléatoire.
 * L'ancienne boucle check-then-act était sujette à une course (P2002 → 500),
 * et un titre sans caractères ASCII produisait un slug vide.
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const base =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "question";

  const suffix = Math.random().toString(36).slice(2, 8);
  let slug = `${base}-${suffix}`;
  let attempts = 0;
  while ((await db.thread.findUnique({ where: { slug } })) && attempts < 5) {
    attempts++;
    slug = `${base}-${Math.random().toString(36).slice(2, 8 + attempts)}`;
  }
  return slug;
}
