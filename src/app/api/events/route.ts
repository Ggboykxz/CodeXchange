import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorSelect } from "@/lib/selects";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { eventCreateSchema, isValidEventRange, pagination } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const { limit, skip } = pagination(new URL(req.url).searchParams, 40);

    const [events, total] = await Promise.all([
      db.event.findMany({
        include: { organizer: { select: authorSelect } },
        orderBy: { date: "asc" },
        take: limit,
        skip,
      }),
      db.event.count(),
    ]);

    return NextResponse.json({ events, total, limit, hasMore: skip + events.length < total });
  } catch (e) {
    logger.route("List events error", e);
    return NextResponse.json({ error: "Failed to list events" }, { status: 500 });
  }
}

/**
 * POST /api/events — annoncer un meetup (G).
 *
 * Les dates sont interprétées par le serveur (`Date.parse`) et bornées :
 * une fin avant le début est refusée ici, pas seulement dans le formulaire.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("Sign in to announce an event");

    const limited = rateLimit(`event:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) return rateLimited("Too many events. Slow down.", limited.retryAfterSec);

    const parsed = eventCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid event payload", parsed.error.flatten().fieldErrors);
    }

    const date = new Date(parsed.data.date);
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    if (!isValidEventRange(date, endDate)) {
      return badRequest("The end of the event must be after its start");
    }

    const event = await db.event.create({
      data: {
        ...parsed.data,
        date,
        endDate,
        organizerId: user.id,
      },
      include: { organizer: { select: authorSelect } },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    logger.route("Create event error", e);
    return NextResponse.json({ error: "Failed to publish event" }, { status: 500 });
  }
}
