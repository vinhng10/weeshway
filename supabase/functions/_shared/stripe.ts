import Stripe from "stripe";

const UPDATABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
];

const NON_RETRYABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "succeeded",
  "processing",
  "requires_capture",
];

export type ReconciliationResult =
  | { action: "REUSE"; intent: Stripe.PaymentIntent }
  | { action: "UPDATE"; intent: Stripe.PaymentIntent }
  | { action: "RECREATE"; reason: string };

/**
 * Determines the reconciliation action for an existing Stripe PaymentIntent.
 * 
 * This is a side-effect-free decision function that does not execute updates directly,
 * making it highly readable, predictable, and easy to unit test.
 *
 * Callers must retrieve the PI with `{ expand: ["latest_charge"] }` so the
 * refund check works; without expansion `latest_charge` is a string id and
 * we'd miss the refund and treat a refunded PI as genuinely paid.
 */
export function analyzePaymentIntent(
  pi: Stripe.PaymentIntent,
  needsUpdate: boolean,
): ReconciliationResult {
  if (pi.status === "succeeded") {
    // A refunded PI keeps status='succeeded' in Stripe (refunds are separate
    // objects). For a rebook-after-refund, retrieving the old PI here would
    // otherwise rebind a stale succeeded-but-refunded PI to the new booking.
    const latestCharge =
      typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    const refunded = (latestCharge?.amount_refunded ?? 0) > 0;
    if (refunded) {
      return {
        action: "RECREATE",
        reason: `PI ${pi.id} succeeded but refunded (amount_refunded=${latestCharge?.amount_refunded}), signaling caller to mint a new PI`,
      };
    }
  }
  if (NON_RETRYABLE_STATUSES.includes(pi.status)) {
    return { action: "REUSE", intent: pi };
  }
  if (pi.status === "canceled") {
    // Stripe forbids confirming a canceled PI, so the caller must create a fresh
    // PaymentIntent. The booking/purchase row stays — only its PI id is replaced.
    return {
      action: "RECREATE",
      reason: `PI ${pi.id} is canceled, signaling caller to mint a new PI`,
    };
  }
  if (UPDATABLE_STATUSES.includes(pi.status)) {
    return needsUpdate
      ? { action: "UPDATE", intent: pi }
      : { action: "REUSE", intent: pi };
  }
  // Unknown / future status — return as-is, don't risk a bad update.
  return { action: "REUSE", intent: pi };
}

