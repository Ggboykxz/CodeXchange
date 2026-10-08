import { NextRequest } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/**
 * GET /api/events — I3 : flux Server-Sent Events temps réel.
 *
 * Design pragmatique (Vercel, sans WebSocket) :
 *
 *  - **une connexion par onglet visible** : le client ferme le flux quand
 *    l'onglet est masqué, et EventSource se reconnecte seul au retour ;
 *  - le serveur **sonde** deux fenêtres glissantes toutes les 8 s
 *    (notifications reçues, messages reçus) et les rejette dans le flux —
 *    pas d'abonnement base, pas de table de gorilles ;
 *  - le flux est **coupé à ~55 s** (`maxDuration = 60`) : le navigateur
 *    rouvre avec son backoff. Une coupure proxy/Vercel est donc normale,
 *    pas une erreur ;
 *  - le polling 60 s de la cloche reste en secours (SSE bloqué, proxy…) :
 *    le temps réel **accélère** l'UI, il ne la remplace pas.
 *
 * Fenêtre glissante : le curseur avance jusqu'à un instant **capturé avant**
 * la requête — une ligne créée pendant l'interrogation a un horodatage
 * supérieur au nouveau curseur et sera récupérée au tour suivant (pas de
 * trou, pas de doublon).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLL_MS = 8_000;
const HEARTBEAT_MS = 15_000;

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  const start = new Date();
  let notifCursor = start;
  let msgCursor = start;

  const stream = new ReadableStream({
    start(controller) {
      const safe = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          closed = true;
        }
      };
      const push = (event: string, data: unknown) =>
        safe(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      push("ready", { at: start.toISOString() });

      // Cœur : ligne commentaire, jamais interpretée — elle sert à vider
      // les buffers intermédiaires et à détecter une connexion morte.
      const heartbeat = setInterval(() => {
        safe(encoder.encode(`: ping ${Date.now()}\n\n`));
      }, HEARTBEAT_MS);

      const poll = setInterval(async () => {
        const notifWindow = new Date();
        const msgWindow = new Date();
        try {
          const [notifs, msgs] = await Promise.all([
            db.notification.findMany({
              where: { recipientId: user.id, createdAt: { gt: notifCursor } },
              orderBy: { createdAt: "asc" },
              take: 20,
              include: {
                actor: { select: { id: true, name: true, image: true } },
              },
            }),
            db.message.findMany({
              where: {
                createdAt: { gt: msgCursor },
                senderId: { not: user.id },
                conversation: {
                  OR: [{ userAId: user.id }, { userBId: user.id }],
                },
              },
              orderBy: { createdAt: "asc" },
              take: 20,
              select: {
                id: true,
                senderId: true,
                body: true,
                createdAt: true,
                conversationId: true,
              },
            }),
          ]);
          notifCursor = notifWindow;
          msgCursor = msgWindow;
          if (closed) return;
          for (const n of notifs) push("notification", n);
          for (const m of msgs) push("message", m);
        } catch (e) {
          // Un sondage qui échoue ne tue pas le flux : le suivant rattrape.
          logger.route("SSE poll error", e);
        }
      }, POLL_MS);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        clearInterval(poll);
        try {
          controller.close();
        } catch {
          /* déjà fermé par le client */
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Proxys (nginx…) ne doivent pas accumuler le flux.
      "X-Accel-Buffering": "no",
    },
  });
}
