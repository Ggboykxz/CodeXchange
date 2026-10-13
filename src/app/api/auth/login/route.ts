import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { createSession } from "@/lib/session";

type CorpsConnexion = Partial<{ email: unknown; password: unknown }>;

/** POST /api/auth/login — connexion puis ouverture de session. */
export async function POST(request: Request) {
  try {
    const corps = (await request.json()) as CorpsConnexion;
    const membre = await loginUser(String(corps.email ?? ""), String(corps.password ?? ""));
    await createSession(membre.id);
    return NextResponse.json({ id: membre.id, nom: membre.nom, slug: membre.slug });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
