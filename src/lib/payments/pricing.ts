/**
 * P1 — autorité tarifaire SERVEUR (M2).
 *
 * Le montant d'un paiement doit venir d'ici, jamais du client. La route
 * `POST /api/payments` résout `{ purpose, targetId }` via `resolvePrice()`
 * et impose le montant + la devise ainsi obtenus. Un client qui enverrait
 * `amount: 100` pour une session à 5 000, ou un `targetId` qui n'est pas
 * du bon type, sera refusé : il ne peut pas fixer son propre prix.
 *
 * Pour les besoins qui n'ont pas de source de prix en base (offre à la
 * une, profil premium), on lit un tarif configuré via l'environnement.
 * Brancher un vrai prestataire + une table de prix ne change que ce
 * module — la route et l'UI n'y touchent pas.
 */
import { db } from "@/lib/db";

/** Devises acceptées — sinon un client imposerait `USD` sur un produit XOF. */
export const ALLOWED_CURRENCIES = ["XOF", "EUR", "USD"] as const;

export type ResolvedPrice = { amount: number; currency: string };

/** Tarifs fixes (hors mentorat), configurables par environnement. */
const FEATURED_JOB_PRICE: ResolvedPrice = {
  amount: Number(process.env.PRICE_FEATURED_JOB ?? 5000),
  currency: process.env.PRICE_CURRENCY ?? "XOF",
};
const PREMIUM_PROFILE_PRICE: ResolvedPrice = {
  amount: Number(process.env.PRICE_PREMIUM_PROFILE ?? 2000),
  currency: process.env.PRICE_CURRENCY ?? "XOF",
};

/**
 * Lit le tarif d'un mentor depuis `Mentor.hourlyRate` (texte libre :
 * « Free », « 30 EUR », « 3 000 FCFA »). Retourne `null` quand il n'y a
 * rien à payer (gratuit / tarif illisible) — la route refuse alors plutôt
 * que de laisser le client inventer un montant.
 */
export function parseMentorPrice(hourlyRate: string | null): ResolvedPrice | null {
  if (!hourlyRate) return null;
  const lower = hourlyRate.toLowerCase();
  if (/\bfree\b|gratuit/.test(lower)) return null;

  const digits = hourlyRate.replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let currency = "XOF";
  if (/€|\beur\b/.test(lower)) currency = "EUR";
  else if (/\$|\busd\b/.test(lower)) currency = "USD";
  return { amount, currency };
}

/**
 * Résout le prix autoritaire d'un achat. `null` = refus (cible absente,
 * mauvais type de cible, tarif gratuit ou illisible).
 */
export async function resolvePrice(
  purpose: string,
  targetId: string | undefined
): Promise<ResolvedPrice | null> {
  switch (purpose) {
    case "mentorship": {
      if (!targetId) return null;
      const mentor = await db.mentor.findUnique({
        where: { id: targetId },
        select: { hourlyRate: true },
      });
      if (!mentor) return null;
      return parseMentorPrice(mentor.hourlyRate);
    }
    case "featured_job": {
      if (!targetId) return null;
      const job = await db.job.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!job) return null;
      return FEATURED_JOB_PRICE;
    }
    case "premium_profile":
      return PREMIUM_PROFILE_PRICE;
    default:
      return null;
  }
}
