import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { createSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/mailer";
import { rateLimitAsync } from "@/lib/rate-limit";

type CorpsInscription = Partial<{
  email: unknown;
  password: unknown;
  nom: unknown;
  ville: unknown;
  pays: unknown;
  titre: unknown;
}>;

/** POST /api/auth/register — inscription puis ouverture de session. */
export async function POST(request: Request) {
  try {
    const corps = (await request.json()) as CorpsInscription;
    const email = String(corps.email ?? "").trim().toLowerCase();

    // Anti-abus : 3 inscriptions par fenêtre de 10 min par e-mail.
    const limiteEmail = await rateLimitAsync(`register:email:${email}`, 3, 10 * 60 * 1000);
    if (!limiteEmail.ok) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives d'inscription. Réessayez plus tard." },
        { status: 429 },
      );
    }
    const membre = await registerUser({
      email: String(corps.email ?? ""),
      password: String(corps.password ?? ""),
      nom: String(corps.nom ?? ""),
      ville: String(corps.ville ?? ""),
      pays: String(corps.pays ?? ""),
      titre: String(corps.titre ?? ""),
    });
    await createSession(membre.id);
    // E-mail de bienvenue (fire-and-forget : ne jamais bloquer l'inscription).
    sendWelcomeEmail(membre.email, membre.nom).catch(() => {});
    return NextResponse.json(
      { id: membre.id, nom: membre.nom, slug: membre.slug },
      { status: 201 },
    );
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
