import postgres from "postgres";
import Stripe from "stripe";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- Configuration ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const PASS_THRESHOLD_MIN = 1;
const BOOKING_THRESHOLD_MIN = 1;
const BATCH_SIZE = 100;

// Raw PaymentIntents created via paymentIntents.create() never auto-expire —
// Stripe only auto-cancels intents created through Checkout Sessions. Anything
// stuck in a requires_* status will sit indefinitely unless we cancel it,
// blocking the project spot via the `Created` occupancy count in payment/.
const CANCELABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
];

const PI_STATUS_TO_TERMINAL: Partial<
  Record<Stripe.PaymentIntent.Status, "Succeeded" | "Canceled">
> = {
  succeeded: "Succeeded",
  canceled: "Canceled",
};

// --- Core Logic ---
type Tally = { reconciled: number; skipped: number; failed: number };

/**
 * Drive a stale PI to a terminal status so the state machine can flip the
 * row. Returns the PI if it reached a terminal status (caller applies it via
 * util.apply_pi_status_*), or null if still in-flight (`processing` /
 * `requires_capture` — leave for a later cron tick).
 *
 * Webhook-loss recovery falls out naturally: a `succeeded` PI whose webhook
 * was dropped is returned as-is on the first branch and gets applied.
 *
 * Stripe rejects cancel() on already-terminal PIs with 400. We catch and
 * re-retrieve to handle the race where the user finishes paying between our
 * retrieve and our cancel.
 */
async function driveToTerminal(
  pi: Stripe.PaymentIntent,
): Promise<Stripe.PaymentIntent | null> {
  if (PI_STATUS_TO_TERMINAL[pi.status]) return pi;
  if (!CANCELABLE_STATUSES.includes(pi.status)) return null;
  try {
    return await stripe.paymentIntents.cancel(pi.id, {
      cancellation_reason: "abandoned",
    });
  } catch {
    const refreshed = await stripe.paymentIntents.retrieve(pi.id);
    return PI_STATUS_TO_TERMINAL[refreshed.status] ? refreshed : null;
  }
}

async function reconcilePasses(): Promise<Tally> {
  // pass_purchases has no updated_at column. Dead-row rebooks bypass the
  // `pass_purchases_created_unique` partial index (WHERE status = 'Created')
  // and INSERT a fresh row rather than reviving an old one, so created_at is
  // stable for the Created lifecycle and safe to threshold on.
  const stale = await sql<
    { id: string; stripe_payment_intent_id: string | null }[]
  >`
    SELECT id, stripe_payment_intent_id
    FROM public.pass_purchases
    WHERE status = 'Created'
      AND created_at < now() - (${PASS_THRESHOLD_MIN} || ' minutes')::interval
    LIMIT ${BATCH_SIZE}
  `;

  const tally: Tally = { reconciled: 0, skipped: 0, failed: 0 };
  for (const row of stale) {
    try {
      if (!row.stripe_payment_intent_id) {
        // Cash-flow orphan: pass-payment committed a Created hold but never
        // bound a PI (Stripe call or binding UPDATE failed after tx commit).
        // No Stripe state to query — cancel the hold directly. Gate on
        // status='Created' AND PI IS NULL so we don't race with pass-payment's
        // post-tx UPDATE that's about to bind.
        const result = await sql`
          UPDATE public.pass_purchases
          SET status = 'Canceled'
          WHERE id = ${row.id}
            AND status = 'Created'
            AND stripe_payment_intent_id IS NULL
        `;
        if (result.count > 0) tally.reconciled++;
        else tally.skipped++;
        continue;
      }

      const pi = await stripe.paymentIntents.retrieve(
        row.stripe_payment_intent_id,
      );
      const terminal = await driveToTerminal(pi);
      if (!terminal) {
        tally.skipped++;
        continue;
      }

      const mapped = PI_STATUS_TO_TERMINAL[terminal.status]!;
      const chargeId = (terminal.latest_charge as string | null) ?? null;
      const [{ apply_pi_status_pass: applied }] = await sql<
        { apply_pi_status_pass: boolean }[]
      >`
        SELECT util.apply_pi_status_pass(
          ${terminal.id},
          ${mapped}::public.pass_status,
          ${chargeId}
        )
      `;
      if (applied) tally.reconciled++;
      else tally.skipped++;
    } catch (error) {
      console.error("pass reconcile failed", row.id, error);
      tally.failed++;
    }
  }
  return tally;
}

async function reconcileBookings(): Promise<Tally> {
  // Threshold runs against updated_at (auto-maintained by the
  // set_booking_updated_at trigger) so the cron doesn't clobber a freshly
  // reset dead row (Canceled/Refunded/Failed → Created) whose created_at is
  // from days ago.
  //
  // pass_purchase_id IS NULL excludes pass-funded bookings — their lifecycle
  // is governed by pass-redeem / refund triggers, not by Stripe PI state.
  const stale = await sql<
    { id: string; stripe_payment_intent_id: string | null }[]
  >`
    SELECT id, stripe_payment_intent_id
    FROM public.bookings
    WHERE status = 'Created'
      AND pass_purchase_id IS NULL
      AND updated_at < now() - (${BOOKING_THRESHOLD_MIN} || ' minutes')::interval
    LIMIT ${BATCH_SIZE}
  `;

  const tally: Tally = { reconciled: 0, skipped: 0, failed: 0 };
  for (const row of stale) {
    try {
      if (!row.stripe_payment_intent_id) {
        const result = await sql`
          UPDATE public.bookings
          SET status = 'Canceled'
          WHERE id = ${row.id}
            AND status = 'Created'
            AND stripe_payment_intent_id IS NULL
        `;
        if (result.count > 0) tally.reconciled++;
        else tally.skipped++;
        continue;
      }

      const pi = await stripe.paymentIntents.retrieve(
        row.stripe_payment_intent_id,
      );
      const terminal = await driveToTerminal(pi);
      if (!terminal) {
        tally.skipped++;
        continue;
      }

      const mapped = PI_STATUS_TO_TERMINAL[terminal.status]!;
      const [{ apply_pi_status_booking: applied }] = await sql<
        { apply_pi_status_booking: boolean }[]
      >`
        SELECT util.apply_pi_status_booking(
          ${terminal.id},
          ${mapped}::public.booking_status
        )
      `;
      if (applied) tally.reconciled++;
      else tally.skipped++;
    } catch (error) {
      console.error("booking reconcile failed", row.id, error);
      tally.failed++;
    }
  }
  return tally;
}

// --- Handler ---
Deno.serve(async (req) => {
  try {
    // Guard Clauses
    if (req.method !== "POST") {
      throw new HttpError("Method Not Allowed", 405);
    }
    authenticateInternalRequest(req);

    const [passes, bookings] = await Promise.all([
      reconcilePasses(),
      reconcileBookings(),
    ]);
    return jsonResponse({ passes, bookings });
  } catch (error: unknown) {
    const { message, status } = handleError("Reconcile Payments Error", error);
    return jsonResponse({ error: message }, status);
  }
});
