import Stripe from "stripe";

const UPDATABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
];

const TERMINAL_NOT_CANCELED: Stripe.PaymentIntent.Status[] = [
  "succeeded",
  "processing",
  "requires_capture",
];

/**
 * Returns:
 *   - the updated PI if we applied updates successfully
 *   - the existing PI as-is if it's in a terminal-but-not-canceled state (succeeded/processing)
 *   - null if the PI is canceled and the caller should create a fresh one
 */
export async function reconcilePaymentIntent(
  pi: Stripe.PaymentIntent,
  applyUpdate: () => Promise<Stripe.PaymentIntent>,
): Promise<Stripe.PaymentIntent | null> {
  if (TERMINAL_NOT_CANCELED.includes(pi.status)) {
    console.log(`reconcilePaymentIntent: skipping update, PI ${pi.id} is ${pi.status}`);
    return pi;
  }
  if (pi.status === "canceled") {
    // Stripe forbids confirming a canceled PI, so the caller must create a fresh
    // PaymentIntent. The booking/purchase row stays — only its PI id is replaced.
    console.log(`reconcilePaymentIntent: PI ${pi.id} is canceled, signaling caller to mint a new PI`);
    return null;
  }
  if (UPDATABLE_STATUSES.includes(pi.status)) {
    return await applyUpdate();
  }
  // Unknown / future status — return as-is, don't risk a bad update.
  console.log(`reconcilePaymentIntent: unknown status ${pi.status} on PI ${pi.id}, returning as-is`);
  return pi;
}
