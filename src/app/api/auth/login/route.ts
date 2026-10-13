import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { createSession } from "@/lib/session";
import { rateLimitAsync } from "@/lib/rate-limit";

type CorpsConnexion = Partial<{ email: unknown; password: unknown }>;

const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** POST /api/auth/login — connexion puis ouverture de session. */
export async function POST(request: Request) {
  try {
    const corps = (await request.json()) as CorpsConnexion;
    const email = String(corps.email ?? "").trim().toLowerCase();

    const limite = await rateLimitAsync(`login:${email}`, LOGIN_MAX, LOGIN_WINDOW_MS);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives. Réessayez dans quelques instants." },
        { status: 429 },
      );
    }

    const membre = await loginUser(String(corps.email ?? ""), String(corps.password ?? ""));
    await createSession(membre.id);
    return NextResponse.json({ id: membre.id, nom: membre.nom, slug: membre.slug });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
