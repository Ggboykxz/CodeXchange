import { NextResponse } from "next/server";
import { errorResponse, isAppError } from "@/lib/errors";
import { NON_CONNECTE, parseId } from "@/lib/forum";
import { getEvent, rsvp } from "@/lib/events";
import { getSessionUserId } from "@/lib/session";

type Contexte = { params: Promise<{ id: string }> };

const INCONNU = { error: "NOT_FOUND", message: "Événement introuvable." } as const;

/**
 * POST /api/events/[id]/rsvp — présence unique : compteur, ou 409 sur doublon.
 * Le doublon est traduit ici en message FR dédié : `errors.ts` (socle livré)
 * reste inchangé et son code 409 « action déjà effectuée » parle des offres
 * d'emploi.
 */
export async function POST(_request: Request, { params }: Contexte) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const { id } = await params;
    const eventId = parseId(id);
    if (eventId === null) return NextResponse.json(INCONNU, { status: 404 });

    const evenement = await getEvent(eventId);
    if (!evenement) return NextResponse.json(INCONNU, { status: 404 });

    const rsvps = await rsvp(eventId, userId);
    return NextResponse.json({ rsvps });
  } catch (erreur) {
    if (isAppError(erreur) && erreur.status === 409) {
      return NextResponse.json(
        {
          error: "RSVP_DUPLICATE",
          message: "Vous avez déjà confirmé votre présence à cet événement.",
        },
        { status: 409 },
      );
    }
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
