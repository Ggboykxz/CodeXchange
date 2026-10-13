import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import {
  FavoriteKind,
  ALL_KINDS,
  toggleFavorite,
  listFavorites,
} from "@/lib/favorites";

export const runtime = "nodejs";

/** GET /api/favoris — tous les favoris de l'utilisateur connecté, groupés. */
export async function GET() {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  const favoris = await listFavorites(userId);
  return NextResponse.json(favoris);
}

function isKind(value: unknown): value is FavoriteKind {
  return typeof value === "string" && ALL_KINDS.includes(value as FavoriteKind);
}

/** POST /api/favoris/toggle — { kind, targetId } → { favori: boolean }. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "AUTH_INVALID", message: "Authentification requise." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { kind?: unknown; targetId?: unknown };
    if (!isKind(body.kind)) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Type de favori invalide." }, { status: 422 });
    }
    if (typeof body.targetId !== "number" || !Number.isInteger(body.targetId) || body.targetId <= 0) {
      return NextResponse.json({ error: "FORUM_VALIDATION", message: "Identifiant invalide." }, { status: 422 });
    }
    const added = await toggleFavorite(userId, body.kind as FavoriteKind, body.targetId);
    return NextResponse.json({ favori: added });
  } catch (error) {
    const { status, body } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
