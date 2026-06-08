import postgres from "postgres";
import Stripe from "stripe";
import { handleError, HttpError } from "../_shared/errors.ts";
import { sendPush } from "../_shared/push.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- Configuration ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const ACCOUNT_WEBHOOK_SECRET = Deno.env.get("STRIPE_ACCOUNT_WEBHOOK_SECRET");

// --- Snapshot (v1) event helpers ---
async function applyPassStatus(
  piId: string,
  status: string,
  chargeId?: string | null,
): Promise<void> {
  await sql`SELECT util.apply_pi_status_pass(${piId}, ${status}::public.pass_status, ${chargeId ?? null})`;
}

async function applyBookingStatus(piId: string, status: string): Promise<void> {
  await sql`SELECT util.apply_pi_status_booking(${piId}, ${status}::public.booking_status)`;
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      if (pi.metadata?.kind === "pass") {
        await applyPassStatus(
          pi.id,
          "Succeeded",
          (pi.latest_charge as string) ?? null,
        );
      } else {
        await applyBookingStatus(pi.id, "Succeeded");
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      if (pi.metadata?.kind === "pass") {
        await applyPassStatus(pi.id, "Failed");
      } else {
        await applyBookingStatus(pi.id, "Failed");
      }
      break;
    }
    case "payment_intent.canceled": {
      const pi = event.data.object;
      if (pi.metadata?.kind === "pass") {
        await applyPassStatus(pi.id, "Canceled");
      } else {
        await applyBookingStatus(pi.id, "Canceled");
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      if (charge.metadata?.kind === "pass") {
        await applyPassStatus(charge.payment_intent as string, "Refunded");
      } else {
        await applyBookingStatus(charge.payment_intent as string, "Refunded");
      }
      break;
    }
    case "refund.updated": {
      const refund = event.data.object;
      const jobId = parseInt(refund.metadata?.jobId ?? "");
      if (refund.status !== "succeeded" || isNaN(jobId)) return;
      await sql`SELECT util.dequeue('refund_jobs', ${jobId})`;
      break;
    }
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
}

// --- Thin (v2) event helpers ---
async function sendActivationPush(token: string): Promise<void> {
  // Best-effort: the onboarding_completed transition has already committed, and
  // a Stripe retry won't re-send (the transition guard short-circuits), so a
  // failed push must not fail the webhook.
  try {
    await sendPush({
      to: token,
      title: "Account Verified! 🎉",
      body: "You can now receive payments from students.",
      data: { wallet: true },
    });
  } catch (error) {
    console.error("Activation push failed:", error);
  }
}

// Account-touching thin events (requirements.updated, the merchant/recipient
// capability_status_updated family, etc.) all mean the same thing: the account's
// verification state may have changed. Rather than branch per type, re-fetch the
// live account and recompute onboarding_completed using the same rule as the
// `account` function, so there is a single source of truth.
async function handleAccountEvent(
  notification: Stripe.V2.Core.EventNotification,
): Promise<void> {
  // A few notification types (e.g. no_meter_found) carry no related_object, so
  // narrow with `in` first. Match on related_object.type (exact) rather than
  // the event-type string: a "v2.core.account" prefix check would also match
  // v2.core.account_person.* and feed a person id into accounts.retrieve.
  if (
    !("related_object" in notification) ||
    notification.related_object?.type !== "v2.core.account"
  ) {
    console.log(`ℹ️ Unhandled thin event type: ${notification.type}`);
    return;
  }

  const account = await stripe.accounts.retrieve(
    notification.related_object.id,
  );
  const completed = !!(
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted
  );

  // Stripe sends a burst of these per state change; the IS DISTINCT FROM guard
  // means only a real transition updates the row and is returned. It's also
  // concurrency-safe: two simultaneous invocations serialize on the row lock,
  // and the second re-evaluates the guard against the committed value, matches
  // zero rows, and sends no duplicate push.
  const [row] = await sql`
    UPDATE public.profiles
    SET onboarding_completed = ${completed}
    WHERE stripe_account_id = ${account.id}
      AND onboarding_completed IS DISTINCT FROM ${completed}
    RETURNING id, expo_push_token
  `;

  // Notify only on the transition into "ready".
  if (row && completed && row.expo_push_token) {
    await sendActivationPush(row.expo_push_token as string);
  }
}

// --- Main Handler ---
Deno.serve(async (req) => {
  try {
    // Guard Clauses
    if (req.method !== "POST") {
      throw new HttpError("Method Not Allowed", 405);
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new HttpError("Missing signature", 400);
    }

    const rawBody = await req.text();

    // Peek at `object` to route by event family before verifying. Snapshot (v1)
    // events are object "event"; v2 thin events are object "v2.core.event". A
    // forged `object` value gains nothing — the parse/verify calls below still
    // gate on the matching signing secret.
    let object: string | undefined;
    try {
      object = JSON.parse(rawBody).object;
    } catch {
      throw new HttpError("Invalid payload", 400);
    }

    if (object === "v2.core.event") {
      if (!ACCOUNT_WEBHOOK_SECRET) {
        throw new HttpError("Missing account webhook secret", 400);
      }
      // parseEventNotificationAsync verifies the signature (Web Crypto, via the
      // async variant Deno needs) and returns a typed notification.
      const notification = await stripe.parseEventNotificationAsync(
        rawBody,
        signature,
        ACCOUNT_WEBHOOK_SECRET,
      );
      await handleAccountEvent(notification);
    } else {
      if (!WEBHOOK_SECRET) {
        throw new HttpError("Missing webhook secret", 400);
      }
      const event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        WEBHOOK_SECRET,
      );
      await handleEvent(event);
    }

    return jsonResponse({ received: true });
  } catch (error: unknown) {
    const { message, status } = handleError("Webhook Error", error);
    return jsonResponse({ error: message }, status);
  }
});
