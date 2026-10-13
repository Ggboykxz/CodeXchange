import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { aRsvp, getEvent } from "@/lib/events";
import { parseId } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Événement introuvable." } as const;

/** GET /api/events/[id] — événement complet (compteur RSVP) + `dejaConfirme`. */
export async function GET(_request: Request, { params }: Contexte) {
  try {
    const { id } = await params;
    const eventId = parseId(id);
    const evenement = eventId === null ? null : await getEvent(eventId);
    if (!evenement || eventId === null) {
      return NextResponse.json(INCONNU, { status: 404 });
    }

    const userId = await getSessionUserId();
    const dejaConfirme = userId === null ? false : await aRsvp(userId, eventId);
    return NextResponse.json({ evenement, dejaConfirme });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
