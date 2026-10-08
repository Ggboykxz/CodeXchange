import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { mentorshipUpdateSchema } from "@/lib/validate";

/**
 * PATCH /api/mentorships/[id] — H5 : le mentor accepte ou refuse ;
 * les deux parties peuvent clore (`complete`).
 *
 * - `accept`  (mentor, pending → accepted) : occupe réellement une place.
 *   Garde de capacité rejouée à cet instant — sinon un mentor ayant
 *   accepté d'autres demandes entre-temps sortirait de sa limite.
 * - `decline` (mentor, pending → declined) : libère la demande.
 * - `complete`(mentor ou mentee, accepted|active → completed) : rend la
 *   place à l'agenda du mentor (slot réel à nouveau disponible).
 *
 * Chaque transition valide la matrice des rôles (seul le mentor agit sur
 * accept/decline ; soit la part des parties sur complete) et notifie
 * l'autre membre.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to answer a request");

    const { id } = await params;
    const parsed = mentorshipUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { action } = parsed.data;

    const mentorship = await db.mentorship.findUnique({ where: { id } });
    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }
    const isMentor = mentorship.mentorId === user.id;
    const isMentee = mentorship.menteeId === user.id;

    if (action === "accept" || action === "decline") {
      if (!isMentor) {
        return NextResponse.json({ error: "Only the mentor can answer" }, { status: 403 });
      }
      if (mentorship.status !== "pending") {
        return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });
      }

      if (action === "accept") {
        const mentor = await db.mentor.findUnique({ where: { userId: mentorship.mentorId } });
        if (!mentor || mentor.slotsTaken >= mentor.capacity) {
          return NextResponse.json(
            { error: "This mentor has no free slot right now" },
            { status: 409 }
          );
        }
        // Occupation ATOMIQUE d'une place : on n'incrémente `slotsTaken`
        // que si la limite tient encore au moment de l'UPDATE. Deux
        // acceptations concurrentes ne peuvent donc pas dépasser
        // `capacity` (le `findUnique`+`if` au-dessus n'est qu'un refus
        // rapide ; celui-ci est le vrai verrou anti-TOCTOU).
        const claimed = await db.mentor.updateMany({
          where: { id: mentor.id, slotsTaken: { lt: mentor.capacity } },
          data: { slotsTaken: { increment: 1 } },
        });
        if (claimed.count === 0) {
          return NextResponse.json(
            { error: "This mentor has no free slot right now" },
            { status: 409 }
          );
        }
        try {
          await db.mentorship.update({ where: { id }, data: { status: "accepted" } });
        } catch (e) {
          // Place rendue si le changement de statut échoue — sinon une
          // acceptation ratée consumerait définitivement un slot.
          await db.mentor
            .update({ where: { id: mentor.id }, data: { slotsTaken: { decrement: 1 } } })
            .catch(() => undefined);
          throw e;
        }
        notify({
          recipientId: mentorship.menteeId,
          actorId: user.id,
          type: "mentorship",
          title: "Demande acceptée ✅",
          body: "Le mentor a accepté ta demande — la visio est prête dès que vous l'êtes.",
          href: "/mentorat",
        }).catch(() => undefined);
      } else {
        await db.mentorship.update({ where: { id }, data: { status: "declined" } });
        notify({
          recipientId: mentorship.menteeId,
          actorId: user.id,
          type: "mentorship",
          title: "Demande déclinée",
          body: "Le mentor n'est pas disponible pour le moment — ta demande est close.",
          href: "/mentorat",
        }).catch(() => undefined);
      }
      return NextResponse.json({ ok: true });
    }

    // action === "complete"
    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: "Not your mentorship" }, { status: 403 });
    }
    if (mentorship.status !== "accepted" && mentorship.status !== "active") {
      return NextResponse.json({ error: "Only an active mentorship can be completed" }, { status: 409 });
    }

    const mentor = await db.mentor.findUnique({ where: { userId: mentorship.mentorId } });
    await db.$transaction([
      db.mentorship.update({ where: { id }, data: { status: "completed" } }),
      ...(mentor
        ? [db.mentor.update({ where: { id: mentor.id }, data: { slotsTaken: Math.max(0, mentor.slotsTaken - 1) } })]
        : []),
    ]);

    notify({
      recipientId: isMentor ? mentorship.menteeId : mentorship.mentorId,
      actorId: user.id,
      type: "mentorship",
      title: "Mentorat terminé 🎓",
      body: "La place a été libérée pour un prochain mentoré.",
      href: "/mentorat",
    }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Mentorship update error", e);
    return NextResponse.json({ error: "Failed to update mentorship" }, { status: 500 });
  }
}
