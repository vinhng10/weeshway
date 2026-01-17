import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const requestSchema = z.object({
  bookingId: z.number().positive(),
});

Deno.serve(async (req) => {
  try {
    const { supabase } = await authenticateRequest(req);

    // 1. Parse & Validate Input
    const body = await req.json();
    const { bookingId } = requestSchema.parse(body);

    // 2. Set booking status to Refunding and fetch the user's succeeded booking
    const { data } = await supabase
      .from("bookings")
      .update({ status: "Refunding" })
      .eq("id", bookingId)
      .select("id, stripe_payment_intent_id")
      .single()
      .throwOnError();

    if (!data?.stripe_payment_intent_id)
      throw new HttpError("No booking found to refund", 404);

    // 3. Create Stripe refund with reverse_transfer
    const refund = await stripe.refunds.create({
      payment_intent: data.stripe_payment_intent_id,
      reverse_transfer: true,
    });

    return jsonResponse({
      refundId: refund.id,
      status: refund.status,
      bookingId,
    });
  } catch (error) {
    const { message, status } = handleError("Refund Error", error);
    return jsonResponse({ error: message }, status);
  }
});
