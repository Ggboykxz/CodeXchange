/**
 * Envoi d'e-mails transactionnels.
 *
 * Transport par défaut : console (démo, 0 €). Pour la production, brancher
 * un transport SMTP (Resend, SendGrid, etc.) via la variable d'environnement
 * `SMTP_URL` — l'interface `TransportEmail` est prévue pour ça.
 */

export type TransportEmail = (message: {
  to: string;
  subject: string;
  html: string;
}) => Promise<void>;

const consoleTransport: TransportEmail = async ({ to, subject, html }) => {
  // En démo : on log à la console. En production, remplacer par un vrai SMTP.
  console.log(`[email] à=${to} sujet=${subject}\n${html}`);
};

const transport: TransportEmail = consoleTransport;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transport({ to, subject, html });
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
