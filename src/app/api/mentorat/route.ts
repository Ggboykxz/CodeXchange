import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { NON_CONNECTE, parseId } from "@/lib/forum";
import { getMentor, listMentors, requestMentor } from "@/lib/mentorat";
import { getSessionUserId } from "@/lib/session";

type CorpsDemande = Partial<{ mentorId: unknown; message: unknown }>;

const INCONNU = { error: "NOT_FOUND", message: "Mentor introuvable." } as const;

/** GET /api/mentorat — annuaire des mentors (`role = "MENTOR"`). */
export async function GET() {
  try {
    const mentors = await listMentors();
    return NextResponse.json({ mentors });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

/** POST /api/mentorat — demande de mentorat (session obligatoire) : 201, 403, 409 ou 422. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return NextResponse.json(NON_CONNECTE.body, { status: NON_CONNECTE.status });
    }

    const corps = (await request.json().catch(() => null)) as CorpsDemande | null;
    const mentorId = parseId(String(corps?.mentorId ?? ""));
    if (mentorId === null) return NextResponse.json(INCONNU, { status: 404 });

    const mentor = await getMentor(mentorId);
    if (!mentor) return NextResponse.json(INCONNU, { status: 404 });

    const id = await requestMentor(mentorId, userId, String(corps?.message ?? ""));
    return NextResponse.json({ id }, { status: 201 });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
