/**
 * P1 — interface prestataire mobile money (Orange Money, MTN MoMo, Wave).
 *
 * Chaque prestataire réel implémente `PaymentProvider` ; en dev/démo,
 * `MockProvider` simule le flux complet sans appel externe. Le reste du
 * code (API, UI) ne connaît que cette interface — brancher un vrai
 * prestataire ne change ni la route ni l'écran, seulement le module
 * importé ici.
 */

export interface InitiateParams {
  amount: number;
  currency: string;
  phoneNumber: string;
  purpose: string;
  targetId?: string;
  /** Référence interne (transaction.id) à renvoyer au prestataire. */
  reference: string;
}

export interface InitiateResult {
  /** ID de la transaction côté prestataire. */
  providerTxId: string;
  /** URL de confirmation ou instructions affichées à l'utilisateur. */
  checkoutUrl?: string;
  /** Message d'instructions (ex. « Validez sur votre téléphone »). */
  message: string;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

export interface PaymentProvider {
  name: string;
  initiate(params: InitiateParams): Promise<InitiateResult>;
  verify(providerTxId: string): Promise<PaymentStatus>;
}

/** Registre des prestataires disponibles, par clé. */
const providers: Record<string, PaymentProvider> = {};

export function registerProvider(key: string, provider: PaymentProvider) {
  providers[key] = provider;
}

export function getProvider(key: string): PaymentProvider | undefined {
  return providers[key];
}

export function listProviders(): string[] {
  return Object.keys(providers);
}
