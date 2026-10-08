import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validate";
import { authUserSelect } from "@/lib/selects";
import {
  clientIp,
  createSession,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import {
  exposesVerificationLink,
  issueVerification,
  verificationUrl,
} from "@/lib/verify";
import { sendWelcomeEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid registration payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { name, email, password, username, country, city, stack, level } =
      parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const existingUsername = await db.profile.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    // Hash asynchrone : pbkdf2Sync bloquait l'event loop (~80 ms/requête).
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        profile: {
          create: {
            username,
            country: country || null,
            city: city || null,
            stack: stack || null,
            level,
            bio: "",
            avatarColor: "terracotta",
          },
        },
      },
      select: authUserSelect,
    });

    // B1 — vérification d'e-mail : le jeton est émis AVANT la réponse,
    // pour que le lien soit déjà valide dès l'ouverture (et qu'une
    // relance du formulaire ne laisse jamais un jeton orphelin).
    const verifyToken = await issueVerification(user.id);

    const token = await createSession(user.id, {
      userAgent: req.headers.get("user-agent"),
      ip: clientIp(req),
    });

    // Le lien part **par e-mail** vers la boîte que le lien est censé
    // prouver : la preuve de possession reste donc intacte. C'est son
    // renvoi dans la réponse HTTP qui est interdit en production —
    // voir `exposesVerificationLink()` dans lib/verify.ts.
    const verifyUrl = verificationUrl(verifyToken);
    const devLink = exposesVerificationLink() ? verifyUrl : null;
    if (devLink) {
      // En dev, le lien apparaît aussi dans le journal pour éviter
      // d'ouvrir la boîte de réception à chaque test.
      console.info(`[verify] ${user.email} → ${devLink}`);
    }

    // B7 — e-mail de bienvenue, porteur du lien de vérification.
    // Envoi réel si `SMTP_HOST` est configuré, aperçu dans le journal
    // sinon. L'envoi ne bloque pas la réponse : l'inscription réussit
    // même si le mail ne part pas (l'erreur est journalisée).
    void sendWelcomeEmail({
      name: user.name,
      email: user.email,
      verifyUrl,
    }).catch((e) => logger.route("Welcome email error", e, { userId: user.id }));

    const response = NextResponse.json(
      { user, ...(devLink ? { verificationUrl: devLink } : {}) },
      { status: 201 }
    );
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    logger.route("Register error", e);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
