import postgres from "postgres";
import Stripe from "stripe";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- Configuration ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// --- Helpers ---
async function upsertBooking(
  paymentIntentId: string,
  status: string,
  metadata: Stripe.PaymentIntent["metadata"] = {}
) {
  await sql`
  INSERT INTO bookings (stripe_payment_intent_id, status, user_id, project_id, spots)
  VALUES (${paymentIntentId}, ${status}, ${metadata.user_id}, ${metadata.project_id}, ${metadata?.spots})
  ON CONFLICT (stripe_payment_intent_id)
  DO ${
    status === "Processing"
      ? sql`NOTHING`
      : sql`UPDATE SET 
              status = EXCLUDED.status,
              user_id = EXCLUDED.user_id,
              project_id = EXCLUDED.project_id,
              spots = EXCLUDED.spots`
  }`;
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.created": {
      const pi = event.data.object;
      await upsertBooking(pi.id, "Processing", pi.metadata);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      await upsertBooking(pi.id, "Succeeded", pi.metadata);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      await upsertBooking(pi.id, "Failed", pi.metadata);
      break;
    }
    case "payment_intent.canceled": {
      const pi = event.data.object;
      await upsertBooking(pi.id, "Canceled", pi.metadata);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      await upsertBooking(
        charge.payment_intent as string,
        "Refunded",
        charge.metadata
      );
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

// --- Main Handler ---
Deno.serve(async (req) => {
  try {
    // Guard Clauses
    if (req.method !== "POST") {
      throw new HttpError("Method Not Allowed", 405);
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature || !WEBHOOK_SECRET) {
      throw new HttpError("Missing signature or secret", 400);
    }

    const rawBody = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      WEBHOOK_SECRET
    );

    await handleEvent(event);
    return jsonResponse({ received: true });
  } catch (error: unknown) {
    const { message, status } = handleError("Webhook Error", error);
    return jsonResponse({ error: message }, status);
  }
});
