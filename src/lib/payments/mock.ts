/**
 * P1 — prestataire mobile money simulé pour le développement et la démo.
 *
 * `initiate()` renvoie immédiatement une référence ; `verify()` marque la
 * transaction `completed` après 3 secondes (simule le délai d'approbation
 * sur le téléphone). En production, on remplace ce module par un vrai
 * appel (Orange Money, MTN MoMo, Wave) sans toucher à l'API ni à l'UI.
 */
import {
  getProvider,
  listProviders,
  registerProvider,
  type InitiateParams,
  type InitiateResult,
  type PaymentProvider,
  type PaymentStatus,
} from "@/lib/payments/provider";

const pendingPayments = new Map<string, { status: PaymentStatus; createdAt: number }>();

const mockProvider: PaymentProvider = {
  name: "mock",

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    const providerTxId = `MOCK-${Date.now().toString(36).toUpperCase()}`;
    pendingPayments.set(providerTxId, { status: "pending", createdAt: Date.now() });
    return {
      providerTxId,
      message: `Validez le paiement de ${params.amount} ${params.currency} sur votre téléphone (${params.phoneNumber}).`,
    };
  },

  async verify(providerTxId: string): Promise<PaymentStatus> {
    const entry = pendingPayments.get(providerTxId);
    if (!entry) return "failed";
    // Après 3 secondes, le paiement est considéré confirmé.
    if (Date.now() - entry.createdAt > 3000 && entry.status === "pending") {
      entry.status = "completed";
    }
    return entry.status;
  },
};

registerProvider("mock", mockProvider);

// Export des helpers pour que les routes/tests n'aient pas à réimplémenter
// le registre.
export { getProvider, listProviders };
export const AVAILABLE_PROVIDERS = ["mock"];
