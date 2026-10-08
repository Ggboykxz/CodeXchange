import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { clientIp, createSession, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mailer";
import {
  avatarColorFor,
  callbackUrl,
  credentials,
  isOAuthProvider,
  normalizeGitHub,
  normalizeGoogle,
  statesMatch,
  usernameCandidates,
  type OAuthProfile,
} from "@/lib/oauth";

const STATE_COOKIE = "cx_oauth_state";
const NEXT_COOKIE = "cx_oauth_next";
const FETCH_TIMEOUT_MS = 10_000;

/**
 * GET /api/oauth/[provider]/callback — retour du fournisseur (B6).
 *
 * Ordre des vérifications, du plus péremptoire au plus lent :
 *   1. fournisseur configuré ;
 *   2. refus utilisateur (`?error=access_denied` → silencieux) ;
 *   3. **`state`** : le cookie doit correspondre à la query (CSRF) ;
 *   4. échange `code → jeton` (serveur seul, `client_secret`) ;
 *   5. profil avec e-mail **vérifié chez le fournisseur** ;
 *   6. rattachement par e-mail, sinon création ;
 *   7. session CodeXchange — même `cx_session` que le login classique.
 *
 * Toute erreur redevient une navigation : `/?oauth_error=code`, lu au
 * montage de l'application pour afficher un toast (jamais de JSON au
 * milieu d'un aller-retour navigateur).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const origin = req.nextUrl.origin;
  const fail = (code: string): NextResponse => {
    const url = new URL("/", origin);
    url.searchParams.set("oauth_error", code);
    return NextResponse.redirect(url, 302);
  };

  try {
    const { provider: raw } = await params;
    if (!isOAuthProvider(raw)) return fail("unknown");

    const creds = credentials(raw, process.env);
    if (!creds) return fail("unconfigured");

    const sp = req.nextUrl.searchParams;

    // L'utilisateur a annulé chez le fournisseur : pas d'erreur à afficher.
    const providerError = sp.get("error");
    if (providerError) {
      return fail(providerError === "access_denied" ? "silent" : "exchange");
    }

    // Le `state` est obligatoire des deux côtés et comparé en temps
    // constant : sans lui, un attaquant pourrait enclencher le retour.
    if (!statesMatch(req.cookies.get(STATE_COOKIE)?.value, sp.get("state"))) {
      return fail("state");
    }
    // `state` bon mais pas de code (et aucune erreur) : réponse
    // incompréhensible du fournisseur — on sépare des deux cas.
    const code = sp.get("code");
    if (!code) return fail("exchange");

    const token = await exchangeCode(raw, code, creds, callbackUrl(raw, origin));
    if (!token) return fail("exchange");

    const profile = await fetchProfile(raw, token);
    if (!profile) return fail("email");

    const userId = await findOrCreateUser(profile);
    // `null` : un compte local existe déjà à cette adresse mais n'a JAMAIS
    // prouvé la possession de sa boîte. Y rattacher un e-mail certifié par
    // le fournisseur laisserait un attaquant (qui a pré-enregistré
    // l'adresse) hériter silencieusement de la connexion future de la
    // victime. On refuse — le membre devra d'abord se connecter par mot de
    // passe ou passer par « mot de passe oublié », qui vérifie la boîte.
    if (userId === null) return fail("link-unverified");

    const sessionToken = await createSession(userId, {
      userAgent: req.headers.get("user-agent"),
      ip: clientIp(req),
    });

    // Retour à la page d'où l'on venait (`#forum/…` ou `/forum/…`),
    // filtré au départ. Les deux formats convergent vers une URL réelle.
    const next = req.cookies.get(NEXT_COOKIE)?.value ?? "";
    let target = new URL("/", origin);
    if (next.startsWith("#") && next.length > 1) {
      target.hash = next;
    } else if (next.startsWith("/") && !next.startsWith("//") && next.length > 1) {
      const resolved = new URL(next, origin);
      // Ceinture de sécurité : la base est déjà filtrée au départ, mais
      // on revérifie l'origine ici — une redirection ne doit JAMAIS sortir
      // du site, surtout sur la réponse qui pose le cookie de session.
      target = resolved.origin === origin ? resolved : new URL("/", origin);
    }

    const res = NextResponse.redirect(target, 302);
    setSessionCookie(res, sessionToken);
    const clear = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 0,
    };
    res.cookies.set(STATE_COOKIE, "", clear);
    res.cookies.set(NEXT_COOKIE, "", clear);
    return res;
  } catch (e) {
    logger.route("OAuth callback error", e);
    return fail("unknown");
  }
}

/* ------------------------------------------------------------------ */
/* Échange de code (jamais côté navigateur)                            */
/* ------------------------------------------------------------------ */

async function exchangeCode(
  provider: "github" | "google",
  code: string,
  creds: { clientId: string; clientSecret: string },
  redirectUri: string
): Promise<string | null> {
  if (provider === "github") {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json().catch(() => null);
    const token = (data as { access_token?: unknown } | null)?.access_token;
    return typeof token === "string" && token.length > 0 ? token : null;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const data: unknown = await res.json().catch(() => null);
  const token = (data as { access_token?: unknown } | null)?.access_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

async function fetchProfile(
  provider: "github" | "google",
  accessToken: string
): Promise<OAuthProfile | null> {
  if (provider === "github") {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "CodeXchange",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const [userRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      fetch("https://api.github.com/user/emails", {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
    ]);
    if (!userRes.ok) return null;
    const user: unknown = await userRes.json();
    const emails: unknown = emailsRes.ok ? await emailsRes.json().catch(() => []) : [];
    return normalizeGitHub(
      (user ?? {}) as Parameters<typeof normalizeGitHub>[0],
      Array.isArray(emails) ? (emails as Parameters<typeof normalizeGitHub>[1]) : []
    );
  }

  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const info: unknown = await res.json().catch(() => null);
  return normalizeGoogle((info ?? {}) as Parameters<typeof normalizeGoogle>[0]);
}

/* ------------------------------------------------------------------ */
/* Rattachement / création                                             */
/* ------------------------------------------------------------------ */

/**
 * Trouve par e-mail (déjà vérifié chez le fournisseur) ou crée le compte :
 * `passwordHash = null` — la connexion par mot de passe refuse déjà les
 * comptes sans hash (`login`), et le « mot de passe oublié » permet
 * d'en poser un plus tard. E-mail marqué vérifié : le fournisseur l'a
 * certifié, le badge B1 est immédiat.
 *
 * Retourne `null` si un compte existe à cette adresse SANS avoir été
 * vérifié (`emailVerifiedAt` null) : le rattachement est refusé pour ne
 * pas livrer la session d'un compte qu'un tiers aurait pu pré-enregistrer.
 */
async function findOrCreateUser(profile: OAuthProfile): Promise<string | null> {
  const existing = await db.user.findUnique({
    where: { email: profile.email },
    select: { id: true, emailVerifiedAt: true },
  });
  if (existing) {
    // L'e-mail est certifié par le fournisseur, mais le compte local ne
    // l'a jamais prouvé : il peut appartenir à quelqu'un d'autre
    // (inscription non vérifiée). Rattacher ici = usurpation.
    return existing.emailVerifiedAt ? existing.id : null;
  }

  for (const username of usernameCandidates(profile.usernameHint)) {
    try {
      const created = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.image,
          passwordHash: null,
          emailVerifiedAt: new Date(),
          role: "member",
          profile: {
            create: { username, avatarColor: avatarColorFor(profile.email) },
          },
        },
        select: { id: true },
      });
      // Premier login OAuth = bienvenue (pas de `verifyUrl` : l'e-mail
      // est déjà certifié par le fournisseur).
      void sendWelcomeEmail({ name: profile.name, email: profile.email }).catch(() => undefined);
      return created.id;
    } catch (e) {
      if ((e as { code?: string })?.code !== "P2002") throw e;
      // Conflit `@unique` : soit l'e-mail (deux callbacks simultanés — on
      // reprend le compte créé), soit le username (candidat suivant).
      // Même garde qu'au-dessus : on ne reprend un compte existant par
      // e-mail que s'il est déjà vérifié (course contre une inscription
      // locale non vérifiée ⇒ on refuse).
      const again = await db.user.findUnique({
        where: { email: profile.email },
        select: { id: true, emailVerifiedAt: true },
      });
      if (again) return again.emailVerifiedAt ? again.id : null;
    }
  }
  throw new Error("OAuth: aucun candidat de nom d'utilisateur disponible");
}
