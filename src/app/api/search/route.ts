import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { rateLimit, SEARCH_POLICY } from "@/lib/rate-limit";
import { normalizeQuery, toResult } from "@/lib/search";

/**
 * GET /api/search?q= — recherche globale transverse (D9).
 *
 * Six groupes, 4 éléments chacun : forum, offres, projets, tutos, agenda,
 * membres. `ILIKE` insensible à la casse — suffisant à cette échelle, pas
 * de service dédié. Réponse `no-store` : les résultats dépendent de « tout
 * ce qui est public », pas d'une session, mais elles changent au fil de
 * l'eau ; surtout, pas de cache CDN sur une recherche.
 */
export async function GET(req: NextRequest) {
  try {
    const limited = rateLimit(
      `search:${clientIp(req)}`,
      SEARCH_POLICY.limit,
      SEARCH_POLICY.windowMs
    );
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many searches" }, { status: 429 });
    }

    const q = normalizeQuery(req.nextUrl.searchParams.get("q"));
    if (q.length < 2) {
      return NextResponse.json(
        { query: q, total: 0, groups: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Un"contains" insensible à la casse par requête. Dans les clauses OR
    // on combine champ-à-champ ; tout terme court (min 2) est accepté.
    const contains = { contains: q, mode: "insensitive" as const };

    const [threads, jobs, projects, tutorials, events, people] = await Promise.all([
      db.thread.findMany({
        where: { OR: [{ title: contains }, { tags: contains }, { category: contains }] },
        orderBy: { upvotes: "desc" },
        take: 4,
        select: { title: true, slug: true, category: true, upvotes: true },
      }),
      db.job.findMany({
        where: { OR: [{ title: contains }, { company: contains }] },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { title: true, company: true },
      }),
      db.project.findMany({
        where: { OR: [{ name: contains }, { tagline: contains }] },
        orderBy: { stars: "desc" },
        take: 4,
        select: { name: true, tagline: true },
      }),
      db.tutorial.findMany({
        where: { OR: [{ title: contains }, { excerpt: contains }] },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { title: true, readTime: true },
      }),
      db.event.findMany({
        where: { OR: [{ title: contains }, { location: contains }] },
        orderBy: { date: "asc" },
        take: 4,
        select: { title: true, date: true, location: true, online: true },
      }),
      db.user.findMany({
        where: { OR: [{ name: contains }, { profile: { is: { username: contains } } }] },
        orderBy: { reputation: "desc" },
        take: 4,
        select: { name: true, profile: { select: { username: true } } },
      }),
    ]);

    return NextResponse.json(
      toResult(q, {
        threads,
        jobs,
        projects,
        tutorials,
        events,
        // `username` indispensable au lien `#annuaire/<username>` ; un
        // compte sans profil public ne se liste pas comme résultat.
        people: people
          .filter((u): u is { name: string; profile: { username: string } } => Boolean(u.profile?.username))
          .map((u) => ({ name: u.name, username: u.profile.username })),
      }),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logger.route("Search error", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
