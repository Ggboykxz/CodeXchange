import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, isStaff, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { jobCreateSchema, pagination } from "@/lib/validate";
import { salaryCurrencies, currencyTerms } from "@/lib/salary";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const type = searchParams.get("type");
    const remote = searchParams.get("remote");
    const stack = searchParams.get("stack");
    const q = searchParams.get("q")?.trim();
    const currency = searchParams.get("currency")?.trim().toUpperCase();
    const { limit, skip } = pagination(searchParams, 30);

    const where: Record<string, unknown> = {};
    if (country && country !== "all") where.country = country;
    if (type && type !== "all") where.type = type;
    if (remote === "true") where.remote = true;
    if (stack && stack !== "all") where.stack = { contains: stack, mode: "insensitive" };
    // Recherche et devise sont deux axes distincts : chacun reste un OR
    // interne, l'ensemble est un AND — jamais un `OR` écrasé par l'autre.
    const and: Record<string, unknown>[] = [];
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { stack: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    // G5 — filtre par devise : LIKE sur les graphies du code (alias
    // compris, cf. `currencyTerms` : « 150K FCFA » matche la puce XOF).
    // On fige le contexte AVANT le filtre pour que les puces restent
    // stables même quand une devise est déjà sélectionnée.
    const whereInContext = { ...where, ...(and.length ? { AND: [...and] } : {}) };
    if (currency && currency !== "ALL") {
      and.push({
        OR: currencyTerms(currency).map((term) => ({
          salary: { contains: term, mode: "insensitive" },
        })),
      });
    }
    if (and.length) where.AND = and;

    const [jobs, total, salaries] = await Promise.all([
      db.job.findMany({
        where,
        include: { author: { select: authorSelect } },
        // G6 — les offres « À la une » passent d'abord, puis chrono.
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip,
      }),
      db.job.count({ where }),
      db.job.findMany({
        where: whereInContext,
        select: { salary: true },
        distinct: ["salary"],
        take: 300,
      }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      limit,
      hasMore: skip + jobs.length < total,
      // G5 — codes réellement présents dans ce contexte de filtres.
      currencies: salaryCurrencies(salaries.map((s) => s.salary)),
    });
  } catch (e) {
    logger.route("List jobs error", e);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

/**
 * POST /api/jobs — publier une offre (G).
 *
 * `authorId` vient de la session serveur : un client qui l'envoie dans le
 * body ne peut pas publier au nom d'un autre.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("Sign in to publish a job offer");

    const limited = rateLimit(`job:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many offers. Slow down.", limited.retryAfterSec);

    const parsed = jobCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten().fieldErrors);
    }

    // G6 — « À la une » est réservé au staff (et c'est un achat payant,
    // cf. `purpose: "featured_job"`). `jobCreateSchema` hérite de
    // `jobPatch`, qui porte `featured` : sans ce garde, n'importe quel
    // membre poserait `featured: true` à la création. Le PATCH a déjà ce
    // contrôle — on le réplique ici pour la création (champ retiré du
    // spread, ré-ajouté seulement si l'appelant est staff).
    const { featured, ...rest } = parsed.data;
    const job = await db.job.create({
      data: {
        ...rest,
        authorId: user.id,
        ...(featured !== undefined && isStaff(user) ? { featured } : {}),
      },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    logger.route("Create job error", e);
    return NextResponse.json({ error: "Failed to publish job" }, { status: 500 });
  }
}
