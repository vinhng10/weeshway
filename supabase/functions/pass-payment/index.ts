import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { exchange, getFees } from "../_shared/fees.ts";
import { flagEnabled } from "../_shared/flags.ts";
import { jsonResponse } from "../_shared/response.ts";
import { reconcilePaymentIntent } from "../_shared/stripe.ts";

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

    let intent: Stripe.PaymentIntent | null = null;

    if (existingPurchase?.stripe_payment_intent_id) {
      // Retry path: retrieve authoritative Stripe state before deciding to update
      const existing = await stripe.paymentIntents.retrieve(
        existingPurchase.stripe_payment_intent_id,
      );
      intent = await reconcilePaymentIntent(existing, () =>
        stripe.paymentIntents.update(existing.id, {
          amount: totalAmount,
          transfer_group: `pass_${pass.id}_${user.id}`,
          metadata: piMetadata,
        }),
      );
    }

    if (intent === null) {
      // New purchase, or PI was canceled — create fresh
      const idempotencyKey = `pass:${pass.id}:${user.id}:${existingPurchase?.stripe_payment_intent_id ?? `${totalAmount}:${pass.currency}:${pass.sessions}`}`;
      intent = await stripe.paymentIntents.create(
        {
          amount: totalAmount,
          currency: pass.currency.toLowerCase(),
          customer_account: student.stripe_account_id,
          transfer_group: `pass_${pass.id}_${user.id}`,
          automatic_payment_methods: { enabled: true },
          metadata: piMetadata,
        },
        { idempotencyKey },
      );

      // Sole writer for the Created state (replaces payment_intent.created webhook).
      // Conflict target = pass_purchases_created_unique (partial: WHERE status='Created').
      // - No row, or only dead rows for (user, pass): INSERT.
      // - Live Created row: re-point its PI id (canceled-race from plan #03).
      // The predicate keeps the conflict from engaging on dead rows, so a webhook
      // that flipped the prior row to Canceled mid-flight cleanly falls through
      // to INSERT instead of mutating the now-Canceled row.
      await sql`
        INSERT INTO public.pass_purchases (
          stripe_payment_intent_id, status, user_id, pass_id,
          sessions, remaining_sessions, price, booking_fee, currency
        ) VALUES (
          ${intent.id}, 'Created', ${user.id}, ${passId},
          ${pass.sessions}, 0, ${pass.price}, ${bookingFeeTotal}, ${pass.currency}
        )
        ON CONFLICT (user_id, pass_id) WHERE status = 'Created'
        DO UPDATE SET stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id
      `;
    }

    // 7. stripe=false: drive pass_purchase to Succeeded synchronously (free/test mode).
    // The state-machine helper handles Created → Succeeded, populates
    // remaining_sessions and expires_at — keep this consistent with the
    // booking path in payment/index.ts.
    const stripeEnabled = await flagEnabled(sql, "stripe");

    if (!stripeEnabled) {
      await sql`
        SELECT util.apply_pi_status_pass(
          ${intent.id},
          'Succeeded'::public.pass_status,
          NULL
        )
      `;

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
