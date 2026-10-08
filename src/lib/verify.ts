import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { verificationDigest } from "@/lib/digest";
import { absoluteUrl } from "@/lib/site";

/** Durée de validité du lien de vérification. */
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

const TOKEN_RE = /^[0-9a-f]{64}$/i;

export type VerificationOutcome = "ok" | "expired" | "invalid";

/**
 * Renvoyer le lien de vérification **dans la réponse HTTP** : utile en
 * dev, **jamais** en production.
 *
 * Le lien part désormais par e-mail (B7) vers la boîte qu'il s'agit de
 * prouver — c'est le canal correct. Le renvoyer aussi à celui qui vient
 * de saisir l'adresse détruirait cette preuve : un attaquant pourrait
 * enregistrer `victim@exemple.com` et récupérer lui-même le lien dans la
 * réponse. On se contente donc de l'e-mail en production, et on ajoute
 * le lien en clair en dev pour ne pas ouvrir une boîte mail à chaque
 * test local.
 */
export function exposesVerificationLink(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Émet un jeton pour `userId`, en remplaçant le précédent (révocation du lien). */
export async function issueVerification(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: userId },
    data: {
      verificationTokenHash: verificationDigest(token),
      verificationExpiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });
  return token;
}

/** URL à ouvrir pour valider — construite sur la même base que le sitemap. */
export function verificationUrl(token: string): string {
  return `${absoluteUrl("/verify")}?token=${token}`;
}

/**
 * Consomme le jeton : valide l'adresse.
 *
 * Le jeton n'est **pas** effacé à la réussite. L'alternative — le purger —
 * ferait échouer la réouverture du lien (F5, retour arrière, double clic,
 * prévisualisation d'un mail), et l'utilisateur verrait « lien invalide »
 * alors qu'il vient de réussir. On garde donc la trace, sans effet
 * supplémentaire : `emailVerifiedAt` est déjà posé, revérifier ne change
 * rien. Un renvoi (`issueVerification`) écrase ce jeton et tue l'ancien lien.
 *
 * La sécurité n'en souffre pas : le hash salé ne donne rien sans
 * `SESSION_SECRET`, et l'objet du jeton (prouver la possession de la boîte)
 * est déjà acquis.
 */
export async function consumeVerification(token: string): Promise<VerificationOutcome> {
  const hash = verificationDigest(token);
  const user = await db.user.findUnique({ where: { verificationTokenHash: hash } });
  if (!user) return "invalid";

  // Déjà vérifié : idempotent, on ne réécrit pas la date de première preuve.
  if (user.emailVerifiedAt) return "ok";

  // Lien périmé : on ne purge pas le hash. Le jeton est déjà refusé à
  // chaque tentative (`verificationExpiresAt` contrôlé ici), donc inutile
  // d'écrire — et conserver l'entrée permet de répondre `expired` à
  // chaque essai, au lieu de basculer en `invalid` dès le second. Un
  // renvoi l'écrase de toute façon.
  if (user.verificationExpiresAt && user.verificationExpiresAt.getTime() <= Date.now()) {
    return "expired";
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
  return "ok";
}

/**
 * Émet un lien si l'adresse existe, `null` sinon — en renvoyant aussi le
 * nom, pour que le mail de vérification soit personnalisé sans requête
 * supplémentaire.
 *
 * L'appelant doit répondre de façon **identique** dans les deux cas :
 * renvoyer un message distinct « adresse inconnue » rendrait possible
 * l'énumération des comptes (le même piège que le login). L'e-mail part
 * seulement si le compte existe, mais il arrive dans la boîte de la
 * victime, pas sous les yeux de l'appelant : la réponse ne bouge pas.
 */
export async function issueVerificationForEmail(
  email: string
): Promise<{ token: string; name: string } | null> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (!user) return null;
  const token = await issueVerification(user.id);
  return { token, name: user.name };
}
