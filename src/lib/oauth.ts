/**
 * OAuth GitHub / Google (B6) — logique **pure** : URLs d'autorisation,
 * configuration, `state`, normalisation des profils, candidats de nom
 * d'utilisateur. Aucune requête réseau ni accès base ici : le vol aller
 * (redirect) et retour (échange de code) vivent dans les routes
 * `app/api/oauth/[provider]…`, et tout ce qui décide est testé dans
 * `tests/oauth.test.ts`.
 *
 * ## Pourquoi pas `next-auth`
 *
 * L'implémentation d'origine transportait la dépendance **sans jamais
 * l'importer**. Réintroduire un cadre complet amènerait son propre
 * modèle de session — alors que CodeXchange possède déjà le sien
 * (`Session` en base, digest SHA-256, cookie `cx_session`, révocation
 * serveur). Le flux code d'autorisation se résume à deux requêtes
 * serveur : on l'écrit, on le teste, et la session reste celle du
 * projet, unique de bout en bout.
 *
 * ## Sécurité
 *
 * - `state` aléatoire (32 octons) stocké en cookie `httpOnly` au départ,
 *   comparé en temps constant au retour : pas d'usurpation CSRF ;
 * - l'échange `code → jeton` ne se fait que serveur, avec `client_secret`
 *   — jamais exposé au navigateur ;
 * - rattachement par e-mail **uniquement vérifié chez le fournisseur**
 *   (liste `verified` de GitHub, `email_verified` de Google) : sinon
 *   n'importe qui pourrait prendre le compte d'un membre existant.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";

/** Les deux fournisseurs, du plus utilisé au moins utilisé. */
export const OAUTH_PROVIDERS = ["github", "google"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** Variables qui commandent l'activation — les deux par fournisseur. */
const CREDENTIALS: Record<OAuthProvider, readonly [string, string]> = {
  github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
};

/** Any map d'env — `process.env` ou un objet factice dans les tests. */
export type OAuthEnv = Record<string, string | undefined>;

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return value === "github" || value === "google";
}

/**
 * Un fournisseur n'est actif que si **ses deux** variables sont
 * renseignées : un client_id seul ne sert à rien, et afficher un bouton
 * qui échouerait au retour serait pire que ne pas l'afficher.
 */
export function isOAuthConfigured(provider: OAuthProvider, env: OAuthEnv): boolean {
  const [idKey, secretKey] = CREDENTIALS[provider];
  return Boolean(env[idKey]?.trim() && env[secretKey]?.trim());
}

/** Liste des boutons à afficher — source unique, exposée par `/api/oauth/providers`. */
export function enabledProviders(env: OAuthEnv): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((p) => isOAuthConfigured(p, env));
}

/** Credentials d'un fournisseur, ou `null` s'il n'est pas configuré. */
export function credentials(
  provider: OAuthProvider,
  env: OAuthEnv
): { clientId: string; clientSecret: string } | null {
  if (!isOAuthConfigured(provider, env)) return null;
  const [idKey, secretKey] = CREDENTIALS[provider];
  return { clientId: env[idKey]!.trim(), clientSecret: env[secretKey]!.trim() };
}

/**
 * URL de retour exacte — celle à déclarer dans l'app d'OAuth du
 * fournisseur. Construite depuis l'origine de la **requête** : local,
 * preview et production passent tous par ici sans configuration.
 */
export function callbackUrl(provider: OAuthProvider, origin: string): string {
  return `${origin.replace(/\/+$/, "")}/api/oauth/${provider}/callback`;
}

/**
 * URL d'autorisation (aller). Le `state` part en query **et** en cookie ;
 * `redirect_uri` doit correspondre caractère pour caractère à ce qui est
 * déclaré auprès du fournisseur.
 */
export function buildAuthorizeUrl(
  provider: OAuthProvider,
  opts: { clientId: string; redirectUri: string; state: string }
): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    state: opts.state,
  });
  if (provider === "github") {
    params.set("scope", "read:user user:email");
    return `https://github.com/login/oauth/authorize?${params}`;
  }
  params.set("response_type", "code");
  params.set("scope", "openid email profile");
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Jeton `state` : 32 octets aléatoires en hexa (256 bits). */
export function randomState(): string {
  return randomBytes(32).toString("hex");
}

/** Comparaison en temps constant — le `state` n'est pas un secret long, 
 *  mais comparer au cas par cas évite tout oracle de longueur. */
export function statesMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/* ------------------------------------------------------------------ */
/* Profils                                                             */
/* ------------------------------------------------------------------ */

/** Profil normalisé : ce dont le serveur a besoin, rien d'autre. */
export type OAuthProfile = {
  /** Toujours vérifié chez le fournisseur — c'est la clé de rattachement. */
  email: string;
  name: string;
  /** Amorce de nom d'utilisateur (login GitHub, partie locale de l'e-mail). */
  usernameHint: string;
  image: string | null;
};

/** Réponse de `GET api.github.com/user`. */
export type GitHubUser = {
  login?: string;
  name?: string | null;
  avatar_url?: string | null;
};

/** Élément de `GET api.github.com/user/emails`. */
export type GitHubEmail = {
  email?: string;
  primary?: boolean;
  verified?: boolean;
};

/**
 * Rattachement GitHub : **uniquement** un e-mail `verified`, en priorité
 * celui marqué `primary`. Sans e-mail vérifié → `null` (l'utilisateur
 * revient avec `?oauth_error=email`), jamais de compte fantôme.
 */
export function normalizeGitHub(user: GitHubUser, emails: GitHubEmail[]): OAuthProfile | null {
  const verified = emails.filter((e) => e.verified && e.email);
  if (verified.length === 0) return null;
  const chosen = verified.find((e) => e.primary) ?? verified[0];
  const email = chosen.email!.toLowerCase();
  const local = email.split("@")[0];
  return {
    email,
    name: user.name?.trim() || user.login?.trim() || local,
    usernameHint: user.login?.trim() || local,
    image: user.avatar_url ?? null,
  };
}

/** Réponse de `GET openidconnect.googleapis.com/v1/userinfo`. */
export type GoogleProfile = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

/** Google : `email_verified` doit être strictement `true`. */
export function normalizeGoogle(profile: GoogleProfile): OAuthProfile | null {
  if (!profile.email || profile.email_verified !== true) return null;
  const email = profile.email.toLowerCase();
  const local = email.split("@")[0];
  return {
    email,
    name: profile.name?.trim() || local,
    usernameHint: local,
    image: profile.picture ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Nom d'utilisateur                                                   */
/* ------------------------------------------------------------------ */

/** Règle de `validate.ts` : `[a-z0-9._-]`, 3–30, commence et finit par alnum. */
export function sanitizeUsername(seed: string): string {
  const cleaned = seed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/[-._]{2,}/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .slice(0, 30)
    .replace(/[^a-z0-9]+$/, "");
  if (cleaned.length >= 3) return cleaned;
  // Trop court après nettoyage (« à@ », « - »…) : on dérive du hash —
  // déterministe, donc stable d'une tentative de login à l'autre.
  return `cx-${stringHash(seed).toString(36).slice(0, 8)}`;
}

/**
 * Candidats dans l'ordre : le login naturel, puis suffixes numériques.
 * La route tente `create` sur chacun jusqu'au premier qui passe — les
 * collisions de `@username` se règlent sans lecture préalable.
 */
export function usernameCandidates(seed: string, max = 8): string[] {
  const base = sanitizeUsername(seed);
  const out = [base];
  for (let i = 2; out.length < Math.max(2, max); i++) {
    out.push(`${base.slice(0, 26)}-${i}`);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

/** La même palette que le seed — l'avatar OAuth ressemble aux autres. */
export const AVATAR_COLORS = ["terracotta", "sun", "clay", "baobab", "sage", "maroon"] as const;

/** djb2 — déterministe : le même e-mail donne toujours la même couleur. */
export function stringHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

export function avatarColorFor(seed: string): string {
  return AVATAR_COLORS[stringHash(seed) % AVATAR_COLORS.length];
}
