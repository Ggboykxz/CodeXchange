import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listThreads, sendDm } from "@/lib/messagerie";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (userId === null) return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  const threads = await listThreads(userId);
  return NextResponse.json(threads);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  try {
    const body = (await request.json()) as Partial<{ recipientId: unknown; corps: unknown }>;
    const rid = Number(body.recipientId);
    if (!Number.isInteger(rid) || rid <= 0) throw new Error("INVALID_RECIPIENT");
    const id = await sendDm(userId, rid, String(body.corps ?? ""));
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SELF_DM") return NextResponse.json({ error: "FORBIDDEN", message: "Vous ne pouvez pas vous envoyer un message." }, { status: 403 });
    if (msg === "INVALID_CORPS") return NextResponse.json({ error: "FORUM_VALIDATION", message: "Message invalide (1 à 2000 caractères)." }, { status: 422 });
    if (msg === "RECIPIENT_NOT_FOUND") return NextResponse.json({ error: "NOT_FOUND", message: "Destinataire introuvable." }, { status: 404 });
    return NextResponse.json({ error: "INTERNAL", message: "Une erreur interne est survenue." }, { status: 500 });
  }
}
