import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import {
  authenticateRequest,
  createServiceRoleClient,
} from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { exchange, getFees } from "../_shared/fees.ts";
import { flagEnabled } from "../_shared/flags.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const requestSchema = z.object({
  passId: z.uuidv7(),
});

Deno.serve(async (req) => {
  try {
    const { supabase, user } = await authenticateRequest(req);

    // 1. Parse & validate
    const body = await req.json();
    const { passId } = requestSchema.parse(body);

    // 2. Fetch student profile + pass (with teacher stripe account) in parallel
    const [{ data: student }, { data: pass }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, stripe_account_id")
        .eq("id", user.id)
        .single()
        .throwOnError(),
      supabase
        .from("passes")
        .select("*, profiles!inner(stripe_account_id)")
        .eq("id", passId)
        .eq("active", true)
        .maybeSingle()
        .throwOnError(),
    ]);

    // 3. Guards
    if (!pass) throw new HttpError("Pass not available.", 404);

    const toStripeAccountId = (
      Array.isArray(pass.profiles) ? pass.profiles[0] : pass.profiles
    )?.stripe_account_id;

    if (!student?.stripe_account_id)
      throw new HttpError("You cannot make payments yet.", 406);
    if (!toStripeAccountId)
      throw new HttpError("Teacher cannot receive payments yet.", 406);

    // 4. Compute amounts (all integer, smallest currency unit)
    const fees = await getFees();
    const bookingFeeInPassCurrency = exchange(
      fees.bookingFee,
      "USD",
      pass.currency,
      fees.usdRates,
    );
    const bookingFeeTotal = bookingFeeInPassCurrency * pass.sessions;
    const totalAmount = pass.price + bookingFeeTotal;

    // 5. Customer session (needed on both new and retry paths)
    const session = await stripe.customerSessions.create({
      customer_account: student.stripe_account_id,
      components: {
        mobile_payment_element: {
          enabled: true,
          features: {
            payment_method_save: "enabled",
            payment_method_redisplay: "enabled",
            payment_method_remove: "enabled",
          },
        },
      },
    });

    // 6. Pre-flight: check for an in-flight Created purchase (Decision #26)
    const { data: existingPurchase } = await supabase
      .from("pass_purchases")
      .select("stripe_payment_intent_id")
      .eq("user_id", user.id)
      .eq("pass_id", passId)
      .eq("status", "Created")
      .maybeSingle();

    const piMetadata = {
      kind: "pass",
      pass_id: pass.id,
      user_id: user.id,
      sessions: pass.sessions,
      price: pass.price,
      booking_fee: bookingFeeTotal,
      currency: pass.currency,
      expiry_days: pass.expiry_days,
      to_stripe_account_id: toStripeAccountId,
    };

    let intent: Stripe.PaymentIntent;

    if (existingPurchase?.stripe_payment_intent_id) {
      // Retry path: refresh amount and metadata on the in-flight PI
      intent = await stripe.paymentIntents.update(
        existingPurchase.stripe_payment_intent_id,
        {
          amount: totalAmount,
          currency: pass.currency.toLowerCase(),
          transfer_group: `pass_${pass.id}_${user.id}`,
          metadata: piMetadata,
        },
      );
    } else {
      // New purchase
      intent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: pass.currency.toLowerCase(),
        customer_account: student.stripe_account_id,
        transfer_group: `pass_${pass.id}_${user.id}`,
        automatic_payment_methods: { enabled: true },
        metadata: piMetadata,
      });
    }

    // 7. stripe=false: upsert pass_purchase synchronously (free/test mode)
    const stripeEnabled = await flagEnabled(sql, "stripe");

    if (!stripeEnabled) {
      const serviceClient = createServiceRoleClient();
      await serviceClient.from("pass_purchases").upsert(
        {
          stripe_payment_intent_id: intent.id,
          status: "Succeeded",
          user_id: user.id,
          pass_id: passId,
          sessions: pass.sessions,
          remaining_sessions: pass.sessions,
          price: pass.price,
          booking_fee: bookingFeeTotal,
          currency: pass.currency,
        },
        { onConflict: "stripe_payment_intent_id" },
      );

      return jsonResponse({
        customerId: student.stripe_account_id,
        paymentIntentClientSecret: intent.client_secret,
        customerSessionClientSecret: session.client_secret,
        autoConfirmed: true,
        status: "succeeded",
      });
    }

    return jsonResponse({
      customerId: student.stripe_account_id,
      paymentIntentClientSecret: intent.client_secret,
      customerSessionClientSecret: session.client_secret,
      status: intent.status,
    });
  } catch (error) {
    const { message, status } = handleError("Pass Payment Error", error);
    return jsonResponse({ error: message }, status);
  }
});
