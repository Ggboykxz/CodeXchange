import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listMessages } from "@/lib/messagerie";
import { parseId } from "@/lib/forum";

type Contexte = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexte) {
  const userId = await getSessionUserId();
  if (userId === null) return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  const { id } = await params;
  const otherId = parseId(id);
  if (otherId === null) return NextResponse.json({ error: "NOT_FOUND", message: "Membre introuvable." }, { status: 404 });
  const messages = await listMessages(userId, otherId);
  return NextResponse.json(messages);
}
