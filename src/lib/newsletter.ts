/**
 * Newsletter CodeXchange (I5) — digest mensuel + désinscription.
 *
 * Deux familles de fonctions dans ce module :
 *   - les **jetons** : dérivés de `SESSION_SECRET` avec une portée `nl:`
 *     propre (le préfixe empêche tout croisement avec sessions,
 *     vérification, réinitialisation). Le jeton est déterministe à partir
 *     de l'e-mail — récupérable au moment d'éditer le digest — mais la
 *     base ne stocke que son digest : extraction ⇒ aucun lien valide ;
 *   - le **digest** : construction du sujet et du corps HTML, pur et
 *     testé (`tests/newsletter.test.ts`). Tout contenu issu du site y
 *     passe par `escapeHtml` : un titre de question contenant du HTML
 *     ne sort pas cru dans la boîte aux lettres.
 */
import { sha256 } from "@/lib/password";
import { SERVER_SECRET as SECRET } from "@/lib/digest";

/**
 * Jeton de désinscription — `sha256(SECRET:nllink:<e-mail>)`.
 * Déterministe : le digest de chaque abonné se recalcule à l'envoi, sans
 * jamais conserver le jeton en clair.
 */
export function nlToken(email: string): string {
  return sha256(`${SECRET}:nllink:${email.trim().toLowerCase()}`);
}

/** Digest stocké en base (`NewsletterSubscriber.tokenHash`). */
export function nlDigest(token: string): string {
  return sha256(`${SECRET}:nl:${token}`);
}

/** Lien absolu de désinscription, à mettre dans chaque envoi. */
export function unsubscribeUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/* ------------------------------------------------------------------ */
/* Digest                                                              */
/* ------------------------------------------------------------------ */

export type DigestItem = { title: string; url: string; meta?: string };

export type DigestData = {
  /** « octobre 2026 » — déjà formaté. */
  month: string;
  threads: DigestItem[];
  jobs: DigestItem[];
  projects: DigestItem[];
  tutorials: DigestItem[];
  events: DigestItem[];
  newMembers: number;
};

/** Libellé de mois en français, déterministe pour une date donnée. */
export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

export function digestSubject(data: DigestData): string {
  return `CodeXchange — ${data.month} : le meilleur du mois dans ta boîte`;
}

/** Échappement HTML — indispensable : titres et sociétés viennent des membres. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sectionHtml(title: string, items: DigestItem[]): string {
  if (items.length === 0) return ""; // une section vide ne se voit pas
  const rows = items
    .map(
      (item) => `      <tr>
        <td style="padding:6px 0">
          <a href="${escapeHtml(item.url)}" style="color:#c2410c;font-weight:600;text-decoration:none">${escapeHtml(item.title)}</a>
${item.meta ? `          <div style="font-size:12px;color:#78716c">${escapeHtml(item.meta)}</div>\n` : ""}        </td>
      </tr>`
    )
    .join("\n");
  return `    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#78716c;margin:24px 0 4px">${escapeHtml(title)}</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
${rows}
    </table>`;
}

function sectionText(title: string, items: DigestItem[]): string {
  if (items.length === 0) return "";
  const lines = items
    .map((item) => `  • ${item.title}${item.meta ? ` — ${item.meta}` : ""}\n    ${item.url}`)
    .join("\n");
  return `${title}\n${lines}\n\n`;
}

/**
 * Corps HTML du digest — gabarit à styles en ligne (les clients e-mail
 * n'aiment pas les feuilles de style externes), pied de page porteur du
 * lien de désinscription.
 */
export function digestHtml(data: DigestData, unsubscribe: string): string {
  const sections =
    [
      sectionHtml("Questions du mois", data.threads),
      sectionHtml("Offres d'emploi", data.jobs),
      sectionHtml("Projets ouverts", data.projects),
      sectionHtml("Tutos & events", data.tutorials),
      sectionHtml("À l'agenda", data.events),
    ]
      .filter(Boolean)
      .join("\n") ||
    `    <p>Le mois a été calme côté publication — le meilleur reste à venir.</p>`;

  const members =
    data.newMembers > 0
      ? `    <p style="color:#57534e"><strong>${data.newMembers}</strong> nouveau${data.newMembers > 1 ? "x" : ""} membre${data.newMembers > 1 ? "s" : ""} ce mois-ci.</p>`
      : "";

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#fafaf9;font-family:ui-sans-serif,system-ui,sans-serif;color:#1c1917">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e5e4;border-radius:8px;padding:24px">
          <tr><td>
            <p style="margin:0;font-weight:700;font-size:15px"><span style="color:#a8a29e">$</span> codexchange<span style="color:#a8a29e">.dev</span></p>
            <h1 style="font-size:20px;margin:12px 0 0">${escapeHtml(data.month)}</h1>
            <p style="color:#57534e;margin:4px 0 0">Le meilleur de CodeXchange, une fois par mois.</p>
${members}
${sections}
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0 12px"/>
            <p style="font-size:12px;color:#78716c;margin:0">
              Tu reçois ce digest parce que tu t'es abonné(e) sur codexchange.dev.<br/>
              <a href="${escapeHtml(unsubscribe)}" style="color:#78716c;text-decoration:underline">Se désabonner en un clic</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Version texte brut — repli des clients qui coupent le HTML. */
export function digestText(data: DigestData, unsubscribe: string): string {
  const body =
    [
      sectionText("Questions du mois", data.threads),
      sectionText("Offres d'emploi", data.jobs),
      sectionText("Projets ouverts", data.projects),
      sectionText("Tutos & events", data.tutorials),
      sectionText("À l'agenda", data.events),
    ].join("") || "Le mois a été calme côté publication.\n\n";

  const members =
    data.newMembers > 0
      ? `${data.newMembers} nouveau${data.newMembers > 1 ? "x" : ""} membre${data.newMembers > 1 ? "s" : ""} ce mois-ci.\n\n`
      : "";

  return `CodeXchange — ${data.month}

${body}${members}Se désabonner : ${unsubscribe}`;
}
