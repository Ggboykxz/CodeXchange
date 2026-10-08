import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { publicUserSelect } from "@/lib/selects";
import { messagePreview, pairOf, peerOf } from "@/lib/messages";
import { messageSendSchema } from "@/lib/validate";
import { rateLimit, CHAT_POLICY } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";
import { badRequest } from "@/lib/api";

/**
 * GET /api/messages — conversations du membre, plus récente d'abord.
 * Chaque ligne porte : l'interlocuteur, le dernier message (aperçu), et le
 * nombre de messages non lus **reçus** (jamais ses propres envois).
 *
 * Les conversations vides (tous les messages supprimées) sont masquées :
 * la liste ne montre que ce qui a réellement un contenu.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to read messages");

    const convs = await db.conversation.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
        messages: { some: {} },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: {
        userA: { select: publicUserSelect },
        userB: { select: publicUserSelect },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: {
            messages: { where: { senderId: { not: user.id }, readAt: null } },
          },
        },
      },
    });

    const conversations = convs.map((c) => {
      const peerId = peerOf(c, user.id); // participant par construction
      const peer = c.userAId === peerId ? c.userA : c.userB;
      return {
        id: c.id,
        peer,
        last: c.messages[0] ?? null,
        unread: c._count.messages,
        lastMessageAt: c.lastMessageAt,
      };
    });

    return NextResponse.json(
      { conversations },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logger.route("Messages list error", e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

/**
 * POST /api/messages — envoyer un message privé.
 *
 * La conversation est **upsertée sur la paire normalisée** (`pairOf`) :
 * écrire en premier crée le fil, écrire à nouveau rejoint le même. Le
 * rate-limit est cléé par émetteur (`msg:<id>`), pas par IP.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to send a message");

    const limited = rateLimit(`msg:${user.id}`, CHAT_POLICY.limit, CHAT_POLICY.windowMs);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many messages. Slow down." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = messageSendSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid message payload", parsed.error.flatten().fieldErrors);
    }
    const { to, body } = parsed.data;

    if (to === user.id) {
      return badRequest("You cannot message yourself");
    }
    const target = await db.user.findUnique({
      where: { id: to },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

    const [a, b] = pairOf(user.id, to);
    const conv = await db.conversation.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      create: { userAId: a, userBId: b },
      update: {},
    });

    const message = await db.$transaction(async (tx) => {
      const m = await tx.message.create({
        data: { conversationId: conv.id, senderId: user.id, body },
      });
      await tx.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: m.createdAt },
      });
      return m;
    });

    notify({
      recipientId: to,
      actorId: user.id,
      type: "message",
      title: `Message de ${user.name}`,
      body: messagePreview(body),
      href: `#messages/${user.id}`,
    }).catch(() => undefined);

    return NextResponse.json({ message, conversationId: conv.id }, { status: 201 });
  } catch (e) {
    logger.route("Send message error", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
