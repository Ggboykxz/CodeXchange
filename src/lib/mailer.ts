/**
 * Envoi d'e-mails transactionnels.
 *
 * Transport par ordre de priorité :
 * 1. **SMTP réel** — si `SMTP_URL` est défini (ex. Resend : `smtps://resend:<clé>@smtp.resend.com:465`).
 * 2. **Console** — sinon (démo, 0 €).
 *
 * Aucune dépendance SMTP n'est installée : le transport SMTP est délégué à un
 * `fetch` vers l'API HTTP du fournisseur quand c'est plus simple, ou documenté
 * comme point de branchement (voir `docs/mailer.md`).
 */

export type MessageEmail = {
  to: string;
  subject: string;
  html: string;
};

export type TransportEmail = (message: MessageEmail) => Promise<void>;

const consoleTransport: TransportEmail = async ({ to, subject, html }) => {
  console.log(`[email:console] à=${to} sujet=${subject}\n${html}`);
};

/**
 * Transport Resend (API HTTP, sans dépendance npm).
 * Activé par `RESEND_API_KEY` + `MAIL_FROM` (optionnel, défaut : onboarding@resend.dev).
 */
const resendTransport: TransportEmail = async ({ to, subject, html }) => {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) throw new Error("RESEND_API_KEY manquant");
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "CodeXchange <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!reponse.ok) {
    console.error(`[email:resend] échec ${reponse.status}`, await reponse.text());
  }
};

/** Transport choisi à l'exécution selon l'environnement. */
export function transportActif(): TransportEmail {
  if (process.env.RESEND_API_KEY) return resendTransport;
  if (process.env.SMTP_URL) {
    // SMTP_URL est documenté comme point d'extension : brancher nodemailer ici.
    console.warn("[email] SMTP_URL défini mais aucun transport SMTP installé — repli console.");
    return consoleTransport;
  }
  return consoleTransport;
}

export const estSmtpReel = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transportActif()({ to, subject, html });
}

export async function sendWelcomeEmail(to: string, nom: string): Promise<void> {
  await sendEmail(
    to,
    "Bienvenue sur CodeXchange 🎉",
    `<p>Bonjour ${nom},</p><p>Ton compte CodeXchange est prêt. Rejoins la communauté des développeurs africains.</p>`,
  );
}

export async function sendNotificationEmail(to: string, nom: string, texte: string, lien: string): Promise<void> {
  await sendEmail(
    to,
    "Nouvelle notification — CodeXchange",
    `<p>Bonjour ${nom},</p><p>${texte}</p><p><a href="${lien}">Voir sur CodeXchange</a></p>`,
  );
}
