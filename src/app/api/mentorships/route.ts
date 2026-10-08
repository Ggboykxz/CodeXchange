import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { publicUserSelect } from "@/lib/selects";

/**
 * GET /api/mentorships — mentorats de l'utilisateur courant, éclatés selon
 * son rôle dans chacune de ses conversations :
 *
 *  - `incoming` : demandes que des membres m'ont adressées EN TANT QUE
 *    mentor (à traiter : accepter / refuser / terminer) ;
 *  - `mine`     : demandes que j'ai envoyées en tant que mentee
 *    (à suivre : statut).
 *
 * Sans session, deux listes vides : même contract de dégradation que pour
 * les autres endpoints personnels (la page reste affichable).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) {
      return NextResponse.json({ incoming: [], mine: [] });
    }

    const select = {
      id: true,
      status: true,
      message: true,
      goal: true,
      createdAt: true,
      mentor: { select: publicUserSelect },
      mentee: { select: publicUserSelect },
    } as const;

    const [incoming, mine] = await Promise.all([
      db.mentorship.findMany({
        where: { mentorId: user.id },
        orderBy: { createdAt: "desc" },
        select,
      }),
      db.mentorship.findMany({
        where: { menteeId: user.id },
        orderBy: { createdAt: "desc" },
        select,
      }),
    ]);

    return NextResponse.json(
      { incoming, mine },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logger.route("Mentorships list error", e);
    return NextResponse.json({ error: "Failed to load mentorships" }, { status: 500 });
  }
}
