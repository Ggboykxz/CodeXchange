/**
 * Envoi d'e-mails (B7) — SMTP réel, aperçu en dev.
 *
 * Deux régimes, pilotés par les variables d'environnement :
 *
 *  1. `SMTP_HOST` renseigné (prod) : transport réel via nodemailer
 *     (compatible Resend, Brevo, Gmail, Postmark, SES SMTP…).
 *     L'e-mail part vraiment vers la boîte du membre.
 *
 *  2. Absent (dev / CI) : aucun serveur n'existe, on imprime
 *     l'e-mail dans le journal du serveur — le même parti que les
 *     liens de vérification (B1). Le retour `"preview"` permet
 *     aux tests et aux logs de distinguer les deux régimes.
 *
 * L'appelant **attrape** toujours l'erreur : un échec SMTP ne doit
 * jamais faire échouer la requête HTTP qui l'a déclenché (une
 * inscription réussit même si le mail de bienvenue ne part pas).
 */
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/newsletter";

/**
 * Un `name`/`email` fourni par le membre (inscription, profil OAuth) finit
 * en clair dans un sujet (ligne d'en-tête SMTP) et dans le corps HTML.
 * On neutralise les sauts de ligne du sujet (injection d'en-tête) et on
 * échappe le HTML du corps — un nom comme `"><a href=…>` ne doit pas
 * produire de balise dans la boîte du destinataire.
 */
function headerSafe(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
}

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  /** Version enrichie ; tombe sur `text` quand elle est absente. */
  html?: string;
};

/** Expéditeur affiché — `SMTP_FROM` ou l'alias de la plateforme. */
export const MAIL_FROM =
  process.env.SMTP_FROM || "CodeXchange <noreply@codexchange.dev>";

/** Le transporteur : type déduit, sans citer le namespace. */
type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | null = null;

/** `true` seulement si un serveur SMTP est configuré. */
export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function getTransporter(): MailTransporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  // Le transporteur est construit une seule fois (connexion tenue
  // en pool par nodemailer), jamais à chaud de la requête.
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
      process.env.SMTP_SECURE === "true"
        ? true
        : process.env.SMTP_SECURE === "false"
          ? false
          : port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/**
 * Envoie (ou imprime) un e-mail. Résout sur `"sent"` / `"preview"` ;
 * rejette sur une erreur SMTP réelle — à l'appelant de la traiter.
 */
export async function sendMail(mail: MailInput): Promise<"sent" | "preview"> {
  const transport = getTransporter();
  if (!transport) {
    console.info(
      `[mail] preview (SMTP non configuré)\n` +
        `[mail] to: ${mail.to}\n` +
        `[mail] subject: ${mail.subject}\n` +
        `[mail] body:\n${mail.text}`
    );
    return "preview";
  }
  await transport.sendMail({
    from: MAIL_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html ?? mail.text,
  });
  return "sent";
}

/**
 * E-mail de bienvenue — envoyé juste après l'inscription.
 *
 * `verifyUrl` est **le seul canal** qui porte le lien de vérification en
 * production : il part vers la boîte que le lien est censé prouver, donc la
 * preuve de possession reste intacte (contrairement au renvoi dans la
 * réponse HTTP, voir `exposesVerificationLink()`).
 */
export function sendWelcomeEmail(input: {
  name: string;
  email: string;
  verifyUrl?: string;
}): Promise<"sent" | "preview"> {
  const verifyBlock = input.verifyUrl
    ? `
Confirme ton adresse pour obtenir le badge « profil vérifié » :

  ${input.verifyUrl}

Ce lien est valable 24 heures.
`
    : "";
  const verifyHtml = input.verifyUrl
    ? `<p>Confirme ton adresse pour obtenir le badge <strong>profil vérifié</strong> :</p>
<p><a href="${escapeHtml(input.verifyUrl)}" style="color:#0b6bcb">${escapeHtml(input.verifyUrl)}</a></p>
<p style="font-size:11px;color:#888">Ce lien est valable 24 heures.</p>
`
    : "";
  return sendMail({
    to: input.email,
    subject: `Bienvenue sur CodeXchange, ${headerSafe(input.name)} 🇦🇫`,
    text:
      `Bienvenue ${input.name},

Ton compte CodeXchange est prêt. Tu peux dès maintenant :

  • poser une question sur le forum (#forum) ;
  • chercher un job vérifié (#jobs) ;
  • rejoindre un projet open source (#projects) ;
  • trouver un mentor ou en devenir un (#mentorat).
${verifyBlock}
À très vite sur le réseau des développeurs africains,
l'équipe CodeXchange

—
Cet e-mail est automatique. Pour te désabonner, supprime ton compte.`,
    html: `<p>Bienvenue ${escapeHtml(input.name)},</p>
<p>Ton compte CodeXchange est prêt. Tu peux dès maintenant :</p>
<ul>
  <li>poser une question sur le <strong>forum</strong></li>
  <li>chercher un job vérifié</li>
  <li>rejoindre un projet open source</li>
  <li>trouver un mentor ou en devenir un</li>
</ul>
${verifyHtml}<p>À très vite sur le réseau des développeurs africains,<br/>l'équipe CodeXchange</p>
<hr/><p style="font-size:11px;color:#888">Cet e-mail est automatique.</p>`,
  });
}

/**
 * E-mail de vérification d'adresse — envoyé à l'inscription via le
 * mail de bienvenue, et à chaque relance (`/api/auth/verify/resend`).
 *
 * C'est le renvoi de ce lien qui rendait B9 inutilisable en production :
 * sans envoi, un membre jamais vérifié ne voyait qu'un avertissement
 * perpétuel et un bouton « Renvoyer » sans effet.
 */
export function sendVerificationEmail(input: {
  name: string;
  email: string;
  verifyUrl: string;
}): Promise<"sent" | "preview"> {
  return sendMail({
    to: input.email,
    subject: "Confirme ton adresse e-mail — CodeXchange",
    text:
      `Bonjour ${input.name},

On nous a demandé de confirmer ton adresse e-mail pour ton compte
CodeXchange (${input.email}).

Ouvre ce lien (valable 24 heures) pour valider ton adresse :

  ${input.verifyUrl}

Si tu n'es pas à l'origine de cette demande, ignore ce message.

—
l'équipe CodeXchange`,
    html: `<p>Bonjour ${escapeHtml(input.name)},</p>
<p>On nous a demandé de confirmer ton adresse e-mail pour ton compte
CodeXchange (${escapeHtml(input.email)}).</p>
<p>Ouvre ce lien — valable <strong>24 heures</strong> — pour valider ton
adresse :</p>
<p><a href="${escapeHtml(input.verifyUrl)}" style="color:#0b6bcb">${escapeHtml(input.verifyUrl)}</a></p>
<p>Si tu n'es pas à l'origine de cette demande, ignore ce message.</p>
<hr/><p style="font-size:11px;color:#888">Lien de vérification valable 24 heures.</p>`,
  });
}

/** E-mail de réinitialisation de mot de passe — lien à usage unique. */
export function sendPasswordResetEmail(input: {
  name: string;
  email: string;
  resetUrl: string;
}): Promise<"sent" | "preview"> {
  return sendMail({
    to: input.email,
    subject: "Réinitialisation de ton mot de passe — CodeXchange",
    text:
      `Bonjour ${input.name},

Une réinitialisation de mot de passe a été demandée pour ton compte
CodeXchange (${input.email}).

Ouvre ce lien (valable 30 minutes) pour choisir un nouveau mot de passe :

  ${input.resetUrl}

Si tu n'es pas à l'origine de cette demande, ignore ce message :
ton mot de passe actuel reste valable.

—
l'équipe CodeXchange`,
    html: `<p>Bonjour ${escapeHtml(input.name)},</p>
<p>Une réinitialisation de mot de passe a été demandée pour ton compte
CodeXchange (${escapeHtml(input.email)}).</p>
<p>Ouvre ce lien — valable <strong>30 minutes</strong> — pour choisir un
nouveau mot de passe :</p>
<p><a href="${escapeHtml(input.resetUrl)}" style="color:#0b6bcb">${escapeHtml(input.resetUrl)}</a></p>
<p>Si tu n'es pas à l'origine de cette demande, ignore ce message :
ton mot de passe actuel reste valable.</p>
<hr/><p style="font-size:11px;color:#888">Lien à usage unique, valable 30 minutes.</p>`,
  });
}

/**
 * Confirmation d'abonnement newsletter (I5) — envoyée dès l'inscription,
 * avec le lien de désinscription : l'abonné dispose d'un moyen de retrait
 * **avant** le premier digest, même si celui-ci n'arrive que le mois
 * prochain.
 */
export function sendNewsletterWelcomeEmail(input: {
  email: string;
  unsubscribeUrl: string;
}): Promise<"sent" | "preview"> {
  return sendMail({
    to: input.email,
    subject: "Abonnement confirmé — newsletter CodeXchange",
    text:
      `Abonnement confirmé.

Tu recevras le digest mensuel de CodeXchange (${input.email}) : les
meilleures questions du forum, les offres d'emploi, les projets ouverts
et l'agenda, une fois par mois.

Désinscription en un clic :
  ${input.unsubscribeUrl}

—
l'équipe CodeXchange`,
    html: `<p>Abonnement confirmé.</p>
<p>Tu recevras le digest mensuel de CodeXchange (<strong>${escapeHtml(input.email)}</strong>) :
les meilleures questions du forum, les offres d'emploi, les projets ouverts
et l'agenda, une fois par mois.</p>
<p><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#0b6bcb">Se désabonner en un clic</a></p>
<hr/><p style="font-size:11px;color:#888">Cet e-mail est automatique.</p>`,
  });
}
