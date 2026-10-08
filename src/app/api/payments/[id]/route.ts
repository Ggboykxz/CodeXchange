import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { logger } from "@/lib/log";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/payments/[id] — statut d'une transaction (propriétaire
 * seulement). Le client vérifie périodiquement jusqu'à ce que le
 * provider confirme (`completed`) ou échoue.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const tx = await db.transaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    if (tx.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: tx.id,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      provider: tx.provider,
      providerTxId: tx.providerTxId,
      purpose: tx.purpose,
      targetId: tx.targetId,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    });
  } catch (e) {
    logger.route("Get payment error", e);
    return NextResponse.json({ error: "Failed to get payment" }, { status: 500 });
  }
}
