import { creditEntryStatement, CREDIT_PACK } from "./credits";
import type { CaptureSummary } from "./paypal";

export type PaymentRow = { id: string; user_id: string; order_id: string; capture_id: string | null; quantity: number; credits: number; amount_cents: number; currency: string; status: string };

export class BillingError extends Error {
  constructor(message: string, readonly status = 400, readonly code = "billing_error") {
    super(message);
  }
}

export function billingErrorResponse(error: unknown) {
  if (error instanceof BillingError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
  console.error("Billing request failed", error);
  return Response.json({ error: "The payment could not be completed. You were not charged twice; refresh to see your balance.", code: "internal_error" }, { status: 500 });
}

/**
 * Grants a completed capture's credits once. The order must be the one this
 * payment row created, in the expected currency and amount.
 */
export async function settleCapture(db: D1Database, payment: PaymentRow, capture: CaptureSummary, now = Math.floor(Date.now() / 1000)) {
  if (capture.referenceId && capture.referenceId !== payment.id) throw new BillingError("This order does not match the payment.", 409, "order_mismatch");
  if (!capture.captureId) throw new BillingError("PayPal returned no capture.", 502, "capture_missing");
  if (capture.captureStatus === "PENDING") {
    await db.prepare("UPDATE payments SET status = 'pending', capture_id = ?, payer_email = ?, updated_at = ? WHERE id = ? AND status IN ('created', 'pending')").bind(capture.captureId, capture.payerEmail, now, payment.id).run();
    return "pending" as const;
  }
  if (capture.captureStatus !== "COMPLETED") {
    await db.prepare("UPDATE payments SET status = 'failed', updated_at = ? WHERE id = ? AND status IN ('created', 'pending')").bind(now, payment.id).run();
    throw new BillingError("PayPal did not complete the payment.", 402, "payment_not_completed");
  }
  if (capture.amountCents !== payment.amount_cents || capture.currency !== payment.currency) throw new BillingError("The paid amount does not match the order.", 409, "amount_mismatch");
  await db.batch([
    creditEntryStatement(db, { userId: payment.user_id, delta: payment.credits, kind: "purchase", reference: capture.captureId, note: `PayPal ${payment.quantity} × ${CREDIT_PACK.credits}` }, now),
    db.prepare("UPDATE payments SET status = 'completed', capture_id = ?, payer_email = COALESCE(?, payer_email), updated_at = ? WHERE id = ? AND status IN ('created', 'pending', 'failed')").bind(capture.captureId, capture.payerEmail, now, payment.id),
  ]);
  return "completed" as const;
}

/** Credits a refund removes: whole packs refunded, at most what the capture granted. */
export function refundedCredits(payment: Pick<PaymentRow, "credits" | "amount_cents">, refundCents: number) {
  if (refundCents >= payment.amount_cents) return payment.credits;
  // Credits cost the same within a payment, so a partial refund removes its share ($3 per credit).
  return Math.min(payment.credits, Math.round((refundCents * payment.credits) / payment.amount_cents));
}
