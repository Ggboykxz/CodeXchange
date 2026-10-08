import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, rateLimited } from "@/lib/api";
import { currentUser, unauthorized } from "@/lib/auth";
import { rateLimit, WRITE_POLICY } from "@/lib/rate-limit";
import { paymentInitiateSchema } from "@/lib/validate";
import { getProvider } from "@/lib/payments/mock";
import { logger } from "@/lib/log";

/**
 * POST /api/payments — initier un paiement mobile money.
 *
 * Crée une transaction `pending`, délègue l'initiation au provider
 * (mock en dev, vrai prestataire en prod), et renvoie les instructions
 * affichées à l'utilisateur (message ou checkoutUrl).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const limited = rateLimit(`pay:${user.id}`, WRITE_POLICY.limit, WRITE_POLICY.windowMs);
    if (!limited.ok) {
      return rateLimited("Too many payment requests. Slow down.", limited.retryAfterSec);
    }

    const parsed = paymentInitiateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Invalid payment payload", parsed.error.flatten().fieldErrors);
    }
    const { provider, amount, currency, phoneNumber, purpose, targetId } = parsed.data;

    const paymentProvider = getProvider(provider);
    if (!paymentProvider) {
      return badRequest(`Provider "${provider}" is not available`);
    }

    // Crée la transaction d'abord pour avoir un `reference` interne.
    const tx = await db.transaction.create({
      data: {
        userId: user.id,
        provider,
        amount,
        currency,
        purpose,
        targetId: targetId ?? null,
        phoneNumber,
      },
    });

    try {
      const result = await paymentProvider.initiate({
        amount,
        currency,
        phoneNumber,
        purpose,
        targetId,
        reference: tx.id,
      });

      await db.transaction.update({
        where: { id: tx.id },
        data: { providerTxId: result.providerTxId },
      });

      return NextResponse.json(
        {
          transaction: {
            id: tx.id,
            status: tx.status,
            amount,
            currency,
            provider,
            providerTxId: result.providerTxId,
          },
          message: result.message,
          checkoutUrl: result.checkoutUrl ?? null,
        },
        { status: 201 }
      );
    } catch (e) {
      // Le provider a échoué : on marque la transaction échouée plutôt
      // que de la laisser `pending` éternellement.
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: "failed" },
      });
      logger.route("Payment initiation failed", e);
      return NextResponse.json({ error: "Payment provider error" }, { status: 502 });
    }
  } catch (e) {
    logger.route("Create payment error", e);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
