import { describe, expect, it } from "vitest";
import {
  AVATAR_COLORS,
  avatarColorFor,
  buildAuthorizeUrl,
  callbackUrl,
  credentials,
  enabledProviders,
  isOAuthConfigured,
  isOAuthProvider,
  normalizeGitHub,
  normalizeGoogle,
  randomState,
  sanitizeUsername,
  statesMatch,
  stringHash,
  usernameCandidates,
  type OAuthEnv,
} from "@/lib/oauth";

/** La règle de `validate.ts`, recopiée : c'est elle que doit satisfaire 
 *  tout nom d'utilisateur produit ici. */
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

describe("configuration — un bouton ne s'affiche qu'avec les deux variables", () => {
  it("rien sans variables", () => {
    expect(isOAuthConfigured("github", {})).toBe(false);
    expect(enabledProviders({})).toEqual([]);
    expect(credentials("github", {})).toBeNull();
  });

  it("un identifiant seul ne suffit pas", () => {
    expect(isOAuthConfigured("github", { GITHUB_CLIENT_ID: "id" })).toBe(false);
    expect(isOAuthConfigured("google", { GOOGLE_CLIENT_SECRET: "s" })).toBe(false);
  });

  it("les deux variables activent le fournisseur", () => {
    const env: OAuthEnv = {
      GITHUB_CLIENT_ID: " gid ",
      GITHUB_CLIENT_SECRET: "gs",
      GOOGLE_CLIENT_ID: "cid",
      GOOGLE_CLIENT_SECRET: "csecret",
    };
    expect(isOAuthConfigured("github", env)).toBe(true);
    expect(enabledProviders(env)).toEqual(["github", "google"]);
    // Les valeurs sont nettoyées : pas d'espace parasite dans l'URL.
    expect(credentials("github", env)).toEqual({
      clientId: "gid",
      clientSecret: "gs",
    });
  });

  it("une variable vide ou en blanc compte comme absente", () => {
    expect(
      isOAuthConfigured("github", { GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "x" })
    ).toBe(false);
    expect(
      isOAuthConfigured("google", { GOOGLE_CLIENT_ID: "   ", GOOGLE_CLIENT_SECRET: "x" })
    ).toBe(false);
  });

  it("isOAuthProvider n'accepte que les deux noms connus", () => {
    expect(isOAuthProvider("github")).toBe(true);
    expect(isOAuthProvider("google")).toBe(true);
    expect(isOAuthProvider("twitter")).toBe(false);
    expect(isOAuthProvider(undefined)).toBe(false);
    expect(isOAuthProvider(42)).toBe(false);
  });
});

describe("callbackUrl — exactement ce qui est déclaré chez le fournisseur", () => {
  it("n'ajoute jamais de double barre", () => {
    expect(callbackUrl("github", "https://code-xchange-nine.vercel.app")).toBe(
      "https://code-xchange-nine.vercel.app/api/oauth/github/callback"
    );
    expect(callbackUrl("google", "https://exemple.dev///")).toBe(
      "https://exemple.dev/api/oauth/google/callback"
    );
  });
});

describe("buildAuthorizeUrl — aller", () => {
  const opts = { clientId: "cid123", redirectUri: "https://x.dev/api/oauth/github/callback", state: "abc" };

  it("github : bon hôte, scope e-mail, state présent", () => {
    const url = new URL(buildAuthorizeUrl("github", opts));
    expect(url.origin).toBe("https://github.com");
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("cid123");
    expect(url.searchParams.get("redirect_uri")).toBe(opts.redirectUri);
    expect(url.searchParams.get("state")).toBe("abc");
    expect(url.searchParams.get("scope")).toBe("read:user user:email");
    expect(url.searchParams.get("response_type")).toBeNull();
  });

  it("google : OIDC standard (response_type=code, scope openid)", () => {
    const url = new URL(buildAuthorizeUrl("google", { ...opts, redirectUri: "https://x.dev/api/oauth/google/callback" }));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe("abc");
  });

  it("le client_secret ne figure jamais dans l'URL d'aller", () => {
    const url = buildAuthorizeUrl("github", opts);
    expect(url).not.toContain("client_secret");
    expect(url).not.toContain("secret");
  });
});

describe("state — anti-CSRF", () => {
  it("32 octets hexadécimaux", () => {
    expect(randomState()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("deux états sont différents", () => {
    expect(randomState()).not.toBe(randomState());
  });

  it("compare juste, refuse le reste", () => {
    const s = randomState();
    expect(statesMatch(s, s)).toBe(true);
    expect(statesMatch(s, randomState())).toBe(false);
    expect(statesMatch(s, `${s}0`)).toBe(false); // longueur différente
    expect(statesMatch(s, undefined)).toBe(false);
    expect(statesMatch(null, s)).toBe(false);
    expect(statesMatch("", "")).toBe(false);
  });
});

describe("normalizeGitHub — e-mail vérifié ou rien", () => {
  const emails = [
    { email: "primaire@exemple.dev", primary: true, verified: true },
    { email: "backup@exemple.dev", primary: false, verified: true },
    { email: "faux@exemple.dev", primary: false, verified: false },
  ];

  it("prend l'e-mail primaire vérifié", () => {
    const p = normalizeGitHub({ login: "ggboykxz", name: "G G" }, emails);
    expect(p?.email).toBe("primaire@exemple.dev");
    expect(p?.name).toBe("G G");
    expect(p?.usernameHint).toBe("ggboykxz");
  });

  it("sans primaire vérifié, prend un vérifié secondaire", () => {
    const p = normalizeGitHub({ login: "x" }, [
      { email: "second@exemple.dev", primary: false, verified: true },
      { email: "non@exemple.dev", primary: true, verified: false },
    ]);
    expect(p?.email).toBe("second@exemple.dev");
  });

  it("aucun e-mail vérifié → refus net (pas de compte fantôme)", () => {
    expect(normalizeGitHub({ login: "x" }, [{ email: "a@b.dev", verified: false }])).toBeNull();
    expect(normalizeGitHub({ login: "x" }, [])).toBeNull();
  });

  it("sans nom, on retombe sur le login puis la partie locale", () => {
    expect(normalizeGitHub({ login: "ada" }, emails)?.name).toBe("ada");
    expect(normalizeGitHub({}, [{ email: "ada@exemple.dev", primary: true, verified: true }])).toMatchObject({
      name: "ada",
      usernameHint: "ada",
      email: "ada@exemple.dev",
    });
  });

  it("l'e-mail est mis en minuscules (clé de rattachement)", () => {
    expect(
      normalizeGitHub({}, [{ email: "Moi@Exemple.Dev", primary: true, verified: true }])?.email
    ).toBe("moi@exemple.dev");
  });
});

describe("normalizeGoogle — email_verified strictement vrai", () => {
  it("profil complet accepté", () => {
    const p = normalizeGoogle({
      email: "moi@exemple.dev",
      email_verified: true,
      name: "Moi",
      picture: "https://lh3/x.png",
    });
    expect(p).toMatchObject({ email: "moi@exemple.dev", name: "Moi", image: "https://lh3/x.png" });
  });

  it("email_verified=false ou absent → refus", () => {
    expect(normalizeGoogle({ email: "a@b.dev", email_verified: false })).toBeNull();
    expect(normalizeGoogle({ email: "a@b.dev" })).toBeNull();
    expect(normalizeGoogle({ email_verified: true })).toBeNull();
  });
});

describe("sanitizeUsername — toujours conforme à la règle validate.ts", () => {
  it("conserve un login déjà valide", () => {
    expect(sanitizeUsername("ggboykxz")).toBe("ggboykxz");
    expect(sanitizeUsername("john.doe-01")).toBe("john.doe-01");
  });

  it("minuscules, sans accent, sans caractère sauvage", () => {
    expect(sanitizeUsername("Aïcha Diallo")).toBe("aicha-diallo");
    expect(sanitizeUsername("  Mon Nom!  ")).toBe("mon-nom");
    expect(sanitizeUsername("a@b.dev")).toBe("a-b.dev");
  });

  it("tréime les séparateurs en bord", () => {
    expect(sanitizeUsername("-début-")).toBe("debut");
    expect(sanitizeUsername("...")).toMatch(USERNAME_RE);
  });

  it("trop court après nettoyage → dérive déterministe", () => {
    const a = sanitizeUsername("à@");
    const b = sanitizeUsername("à@");
    expect(a).toBe(b);
    expect(a).toMatch(USERNAME_RE);
    expect(a.length).toBeGreaterThanOrEqual(3);
  });

  it("tronque à 30 caractures en restant valide", () => {
    const long = sanitizeUsername(`${"x".repeat(45)}.suite`);
    expect(long.length).toBeLessThanOrEqual(30);
    expect(long).toMatch(USERNAME_RE);
  });

  it("tous les cas produits respectent la regex", () => {
    for (const seed of ["Ggboykxz", "ЖЖЖ", "  ", "-x-", "Ünïcödé", "a".repeat(80), "OK_1"]) {
      expect(sanitizeUsername(seed), seed).toMatch(USERNAME_RE);
    }
  });
});

describe("usernameCandidates — tentative de création sans lecture préalable", () => {
  it("premier candidat = login naturel, puis suffixes", () => {
    const list = usernameCandidates("ada");
    expect(list[0]).toBe("ada");
    expect(list.slice(1)).toEqual(["ada-2", "ada-3", "ada-4", "ada-5", "ada-6", "ada-7", "ada-8"]);
  });

  it("pas de doublon et tous valides", () => {
    const list = usernameCandidates("très-court", 5);
    expect(new Set(list).size).toBe(list.length);
    for (const u of list) expect(u).toMatch(USERNAME_RE);
  });

  it("les suffixes ne dépassent pas 30 caractères", () => {
    const list = usernameCandidates("z".repeat(40));
    for (const u of list) expect(u.length).toBeLessThanOrEqual(30);
  });
});

describe("avatar — déterministe comme le seed", () => {
  it("stringHash est stable", () => {
    expect(stringHash("moi@exemple.dev")).toBe(stringHash("moi@exemple.dev"));
    expect(stringHash("a")).not.toBe(stringHash("b"));
  });

  it("la couleur reste dans la palette du seed", () => {
    for (const email of ["a@b.dev", "x@y.dev", "nour@exemple.dev"]) {
      expect(AVATAR_COLORS).toContain(avatarColorFor(email));
    }
    expect(avatarColorFor("stable@x.dev")).toBe(avatarColorFor("stable@x.dev"));
  });
});
