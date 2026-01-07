import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";

// --- Configuration ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// --- Types & Constants ---
type BookingStatus = "Processing" | "Succeeded" | "Failed" | "Canceled";

const STATUS_MAP: Record<string, BookingStatus> = {
  "payment_intent.created": "Processing",
  "payment_intent.succeeded": "Succeeded",
  "payment_intent.payment_failed": "Failed",
  "payment_intent.canceled": "Canceled",
};

// --- Helpers ---
const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function upsertBooking(
  paymentIntentId: string,
  status: BookingStatus,
  metadata?: { user_id?: string; project_id?: string }
) {
  const bookingData: any = {
    stripe_payment_intent_id: paymentIntentId,
    status,
  };

  // Include metadata only for creation events
  if (metadata?.user_id && metadata?.project_id) {
    bookingData.user_id = metadata.user_id;
    bookingData.project_id = metadata.project_id;
  }

  const { error } = await supabase.from("bookings").upsert(bookingData, {
    onConflict: "stripe_payment_intent_id",
    ignoreDuplicates: status === "Processing",
  });

  if (error) console.error(`DB error (${status}):`, error.message);
}

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

    const status = STATUS_MAP[event.type];
    if (!status) {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
      return jsonResponse({ received: true });
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { user_id, project_id } = paymentIntent.metadata;

    // Validate metadata for creation events
    if (event.type === "payment_intent.created" && (!user_id || !project_id)) {
      return jsonResponse({ error: "Missing user_id or project_id" }, 400);
    }

    await upsertBooking(paymentIntent.id, status, { user_id, project_id });

    return jsonResponse({ received: true });
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    const status = err.message.includes("signature") ? 400 : 500;
    return jsonResponse({ error: err.message }, status);
  }
});
