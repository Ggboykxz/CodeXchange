import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { publicUserSelect } from "@/lib/selects";
import { pairOf } from "@/lib/messages";

/**
 * GET /api/messages/thread?peer=<userId> — le fil complet avec un membre.
 *
 * Effet de bord assumé (et idempotent) : ouvrir le fil marque les messages
 * **reçus** comme lus. C'est le geste naturel du client — un PATCH séparé
 * ajouterait une aller-retour pour un état qui converge de toute façon à
 * la lecture. `Cache-Control: no-store` : l'état doit être frais.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to read messages");

    const peerId = new URL(req.url).searchParams.get("peer")?.trim();
    if (!peerId) return NextResponse.json({ error: "peer manquant" }, { status: 400 });
    if (peerId === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous écrire" }, { status: 400 });
    }

    const peer = await db.user.findUnique({
      where: { id: peerId },
      select: publicUserSelect,
    });
    if (!peer) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const [a, b] = pairOf(user.id, peerId);
    const conv = await db.conversation.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
    });

    if (conv) {
      await db.message.updateMany({
        where: {
          conversationId: conv.id,
          senderId: { not: user.id },
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json(
      {
        peer,
        conversationId: conv?.id ?? null,
        messages: conv?.messages ?? [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logger.route("Thread read error", e);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}
