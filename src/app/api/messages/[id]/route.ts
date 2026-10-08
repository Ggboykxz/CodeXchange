import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/messages/[id] — supprimer **son propre** message.
 *
 * Après suppression, la conversation est réalignée : dernier message
 * restant → `lastMessageAt` recule ; plus aucun message → la conversation
 * est supprimée (elle disparaît donc de la liste). L'E2E s'en sert pour
 * rendre la base à son état d'origine.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to delete a message");

    const { id } = await params;
    const message = await db.message.findUnique({
      where: { id },
      select: { id: true, senderId: true, conversationId: true, createdAt: true },
    });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== user.id) {
      return NextResponse.json({ error: "You can only delete your own message" }, { status: 403 });
    }

    await db.message.delete({ where: { id } });

    const last = await db.message.findFirst({
      where: { conversationId: message.conversationId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!last) {
      await db.conversation.delete({ where: { id: message.conversationId } });
    } else if (message.createdAt >= last.createdAt) {
      // On venait de supprimer le dernier : `lastMessageAt` recule au vrai
      // dernier message (sinon l'ordre de la liste ment).
      await db.conversation.update({
        where: { id: message.conversationId },
        data: { lastMessageAt: last.createdAt },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Delete message error", e);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
