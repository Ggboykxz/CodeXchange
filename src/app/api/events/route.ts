import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE } from "@/lib/forum";
import { createEvent, listEvents } from "@/lib/events";
import { getSessionUserId } from "@/lib/session";

type CorpsEvenement = Partial<{
  titre: unknown;
  description: unknown;
  date: unknown;
  format: unknown;
  ville: unknown;
  pays: unknown;
  lien: unknown;
}>;

/** GET /api/events — événements triés par date croissante (passés d'abord). */
export async function GET() {
  try {
    const evenements = await listEvents();
    return NextResponse.json({ evenements });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

/** POST /api/events — publication d'un événement (session obligatoire). */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const corps = (await request.json().catch(() => null)) as CorpsEvenement | null;
    const id = await createEvent({
      titre: String(corps?.titre ?? ""),
      description: String(corps?.description ?? ""),
      date: String(corps?.date ?? ""),
      format: String(corps?.format ?? ""),
      ville: String(corps?.ville ?? ""),
      pays: String(corps?.pays ?? ""),
      lien: String(corps?.lien ?? ""),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
