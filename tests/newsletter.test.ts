import { describe, expect, it } from "vitest";
import {
  digestHtml,
  digestSubject,
  digestText,
  escapeHtml,
  monthLabel,
  nlDigest,
  nlToken,
  unsubscribeUrl,
  type DigestData,
} from "@/lib/newsletter";
import { sendNewsletterWelcomeEmail } from "@/lib/mailer";

const HEX64 = /^[0-9a-f]{64}$/;

const data: DigestData = {
  month: "octobre 2026",
  threads: [
    { title: "Comment structurer une API ?", url: "https://x.dev/#forum/api", meta: "12 upvotes" },
    { title: "Astuce <script>alert(1)</script>", url: "https://x.dev/#forum/astuce" },
  ],
  jobs: [{ title: "Backend Go", url: "https://x.dev/#jobs", meta: "Paystack" }],
  projects: [],
  tutorials: [],
  events: [],
  newMembers: 3,
};

describe("jetons de désinscription — dérivés, jamais stockés en clair", () => {
  it("nlToken est déterministe et de forme jeton", () => {
    expect(nlToken("Moi@Exemple.dev")).toMatch(HEX64);
    expect(nlToken("moi@exemple.dev")).toBe(nlToken("  MOI@exemple.dev  "));
  });

  it("deux adresses n'ont jamais le même jeton", () => {
    expect(nlToken("a@b.dev")).not.toBe(nlToken("c@d.dev"));
  });

  it("nlDigest est un digest, pas le jeton — et il est stable", () => {
    const token = nlToken("a@b.dev");
    expect(nlDigest(token)).toMatch(HEX64);
    expect(nlDigest(token)).not.toBe(token);
    expect(nlDigest(token)).toBe(nlDigest(token));
    // Portée propre : un jeton de session ne digère pas pareil.
    expect(nlDigest(token)).not.toBe(nlDigest(nlToken("c@d.dev")));
  });

  it("unsubscribeUrl est absolu et encode le jeton", () => {
    expect(unsubscribeUrl("https://code-xchange-nine.vercel.app/", "abc123")).toBe(
      "https://code-xchange-nine.vercel.app/api/newsletter/unsubscribe?token=abc123"
    );
    expect(unsubscribeUrl("https://x.dev", "a b")).toContain("token=a%20b");
  });
});

describe("escapeHtml — aucun HTML de membre ne sort cru", () => {
  it("neutralise balises, guillemets et esperluettes", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(escapeHtml("père & fils")).toBe("père &amp; fils");
    expect(escapeHtml("l'apostrophe")).toBe("l&#39;apostrophe");
  });

  it("l'esperluette est échappée avant tout (pas de double encodage parasite)", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("digest — sujet et corps", () => {
  it("le sujet porte le mois", () => {
    expect(digestSubject(data)).toContain("octobre 2026");
    expect(digestSubject(data)).toContain("CodeXchange");
  });

  it("monthLabel est en français", () => {
    expect(monthLabel(new Date(Date.UTC(2026, 9, 15)))).toBe("octobre 2026");
    expect(monthLabel(new Date(Date.UTC(2026, 0, 15)))).toBe("janvier 2026");
  });

  it("le HTML contient titres échappés, liens absolus et désinscription", () => {
    const html = digestHtml(data, "https://x.dev/api/newsletter/unsubscribe?token=T");
    expect(html).toContain("Comment structurer une API ?");
    expect(html).toContain("https://x.dev/#forum/api");
    expect(html).toContain("https://x.dev/api/newsletter/unsubscribe?token=T");
    // Le titre hostile est échappé : la balise script n'existe pas.
    expect(html).toContain("Astuce &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("<strong>3</strong> nouveaux membres ce mois-ci");
  });

  it("les sections vides disparaissent, le repli oui", () => {
    const empty: DigestData = { month: "janvier 2026", threads: [], jobs: [], projects: [], tutorials: [], events: [], newMembers: 0 };
    const html = digestHtml(empty, "https://x.dev/unsub");
    expect(html).not.toContain("Questions du mois");
    expect(html).not.toContain("Offres d'emploi");
    expect(html).toContain("Le mois a été calme");
    expect(digestSubject(empty)).toContain("janvier 2026");
  });

  it("le texte brut porte le même contenu et le lien", () => {
    const text = digestText(data, "https://x.dev/unsub");
    expect(text).toContain("Comment structurer une API ?");
    expect(text).toContain("https://x.dev/unsub");
    expect(text).toContain("octobre 2026");
    // Version texte : contenu affiché tel quel (inoffensif hors HTML),
    // aucune balise produite par le générateur lui-même.
    expect(text).toContain("Astuce <script>alert(1)</script>");
    expect(text).not.toContain("<table");
  });
});

describe("mail de confirmation d'abonnement", () => {
  it("résout 'preview' sans SMTP et porte le lien de désinscription", async () => {
    delete process.env.SMTP_HOST;
    const unsub = "https://x.dev/api/newsletter/unsubscribe?token=T";
    const result = await sendNewsletterWelcomeEmail({ email: "a@b.dev", unsubscribeUrl: unsub });
    expect(result).toBe("preview");
  });
});
