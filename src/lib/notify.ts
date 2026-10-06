import { db } from "@/lib/db";

/**
 * In-app notification helpers.
 *
 * Creating a notification must never break the action that triggered it:
 * callers use `notify()` fire-and-forget and failures are logged, not thrown.
 */

export type NotifyInput = {
  recipientId: string;
  actorId?: string | null;
  type: "reply" | "answer" | "mentorship" | "follow" | "mention" | "system";
  title: string;
  body?: string;
  href?: string;
};

export async function notify(input: NotifyInput): Promise<void> {
  // Never notify someone about their own action.
  if (input.actorId && input.actorId === input.recipientId) return;
  if (!input.recipientId) return;

  try {
    await db.notification.create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actorId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch (error) {
    console.error("notify failed:", error);
  }
}

export async function unreadCount(recipientId: string): Promise<number> {
  return db.notification.count({ where: { recipientId, read: false } });
}
