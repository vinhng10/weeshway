import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";

// --- 1. Clients & Configuration ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 2. Helper: Update Booking Status ---
async function updateBookingStatus(paymentIntentId: string, status: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) throw new Error(`DB Update Failed: ${error.message}`);
}

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

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

    const data = event.data.object as Stripe.PaymentIntent;

    // Handle Event Types
    switch (event.type) {
      case "payment_intent.succeeded":
        await updateBookingStatus(data.id, "Succeeded");
        break;

      case "payment_intent.payment_failed":
        await updateBookingStatus(data.id, "Failed");
        break;

      case "payment_intent.created": {
        const { user_id, project_id } = data.metadata;
        if (!user_id || !project_id) {
          return jsonResponse({ error: "Missing user_id or project_id" }, 400);
        }
        const { error } = await supabase.from("bookings").insert({
          stripe_payment_intent_id: data.id,
          user_id,
          project_id,
          status: "Processing",
        });
        if (error) console.error("Insert error:", error.message);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    // Return 400 for signature errors, 500 for internal processing errors
    const status = err.message.includes("signature") ? 400 : 500;
    return jsonResponse({ error: err.message }, status);
  }
});
