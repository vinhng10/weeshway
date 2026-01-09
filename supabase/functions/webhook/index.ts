import Stripe from "stripe";
import { createServiceRoleClient } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- Configuration ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createServiceRoleClient();
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// --- Types ---
type EventHandler = (event: Stripe.Event) => Promise<void> | void;

async function upsertBooking(
  paymentIntentId: string,
  status: string,
  metadata: Stripe.PaymentIntent["metadata"] = {}
) {
  const { error } = await supabase.from("bookings").upsert(
    {
      stripe_payment_intent_id: paymentIntentId,
      status,
      user_id: metadata.user_id,
      project_id: metadata.project_id,
      spots: metadata?.spots,
    },
    {
      onConflict: "stripe_payment_intent_id",
      ignoreDuplicates: status === "Processing",
    }
  );

  if (error) console.error(`DB error (${status}):`, error.message);
}

// --- Event Handlers ---
const handlers: Record<string, EventHandler> = {
  "payment_intent.created": async (event) => {
    const pi = event.data.object as Stripe.PaymentIntent;
    await upsertBooking(pi.id, "Processing", pi.metadata);
  },
  "payment_intent.succeeded": async (event) => {
    const pi = event.data.object as Stripe.PaymentIntent;
    await upsertBooking(pi.id, "Succeeded", pi.metadata);
  },
  "payment_intent.payment_failed": async (event) => {
    const pi = event.data.object as Stripe.PaymentIntent;
    await upsertBooking(pi.id, "Failed", pi.metadata);
  },
  "payment_intent.canceled": async (event) => {
    const pi = event.data.object as Stripe.PaymentIntent;
    await upsertBooking(pi.id, "Canceled", pi.metadata);
  },
};

// --- Main Handler ---
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature || !WEBHOOK_SECRET) {
    return jsonResponse({ error: "Missing signature or secret" }, 400);
  }

  try {
    const rawBody = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      WEBHOOK_SECRET
    );

    const handler = handlers[event.type];
    if (!handler) {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
      return jsonResponse({ received: true });
    }

    await handler(event);
    return jsonResponse({ received: true });
  } catch (err: unknown) {
    const { message, status } = handleError("Webhook Error", err);
    return jsonResponse({ error: message }, status);
  }
});
