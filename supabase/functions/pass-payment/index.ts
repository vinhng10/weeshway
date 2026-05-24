import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { exchange, getFees } from "../_shared/fees.ts";
import { flagEnabled } from "../_shared/flags.ts";
import { jsonResponse } from "../_shared/response.ts";
import { analyzePaymentIntent } from "../_shared/stripe.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const requestSchema = z.object({
  passId: z.uuidv7(),
});

type TxResult = {
  purchaseId: string;
  priorPiId: string | null;
};

Deno.serve(async (req) => {
  try {
    const { supabase, user } = await authenticateRequest(req);

    const body = await req.json();
    const { passId } = requestSchema.parse(body);

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

    if (!pass) throw new HttpError("Pass not available.", 404);

    const toStripeAccountId = (
      Array.isArray(pass.profiles) ? pass.profiles[0] : pass.profiles
    )?.stripe_account_id;

    if (!student?.stripe_account_id)
      throw new HttpError("You cannot make payments yet.", 406);
    if (!toStripeAccountId)
      throw new HttpError("Teacher cannot receive payments yet.", 406);

    const fees = await getFees();
    const bookingFeeInPassCurrency = exchange(
      fees.bookingFee,
      "USD",
      pass.currency,
      fees.usdRates,
    );
    const bookingFeeTotal = bookingFeeInPassCurrency * pass.sessions;
    const totalAmount = pass.price + bookingFeeTotal;

    // Transactional Created-row reservation. The partial unique index
    // pass_purchases_created_unique enforces at most one Created row per
    // (user, pass) — retries land on the conflict path; dead-row rebooks
    // (Refunded/Failed/Canceled/Succeeded/Used/Expired) fall through to INSERT
    // as a fresh row, preserving purchase history.
    const txResult: TxResult = await sql.begin(async (tx) => {
      const [existing] = await tx`
        SELECT id, stripe_payment_intent_id
        FROM public.pass_purchases
        WHERE user_id = ${user.id} AND pass_id = ${passId} AND status = 'Created'
        FOR UPDATE
      `;

      const [row] = await tx`
        INSERT INTO public.pass_purchases (
          stripe_payment_intent_id, status, user_id, pass_id,
          seller_id, name, description, photo_url,
          sessions, remaining_sessions, expiry_days,
          price, booking_fee, currency
        ) VALUES (
          NULL, 'Created', ${user.id}, ${passId},
          ${pass.user_id}, ${pass.name}, ${pass.description}, ${pass.photo_url},
          ${pass.sessions}, 0, ${pass.expiry_days},
          ${pass.price}, ${bookingFeeTotal}, ${pass.currency}
        )
        ON CONFLICT (user_id, pass_id) WHERE status = 'Created' DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            photo_url = EXCLUDED.photo_url
        RETURNING id
      `;

      return {
        purchaseId: row.id,
        priorPiId: existing?.stripe_payment_intent_id ?? null,
      };
    });

    const { purchaseId, priorPiId } = txResult;

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

    if (priorPiId) {
      const existing = await stripe.paymentIntents.retrieve(priorPiId, {
        expand: ["latest_charge"],
      });
      const needsUpdate = existing.amount !== totalAmount;
      const reconciliation = analyzePaymentIntent(existing, needsUpdate);

      console.log(
        `reconcilePaymentIntent: Action: ${reconciliation.action}. ${
          reconciliation.action === "RECREATE"
            ? `Reason: ${reconciliation.reason}`
            : `PI ${existing.id} status is ${existing.status}`
        }`,
      );

      switch (reconciliation.action) {
        case "REUSE":
          intent = reconciliation.intent;
          break;
        case "UPDATE":
          intent = await stripe.paymentIntents.update(
            reconciliation.intent.id,
            {
              amount: totalAmount,
              transfer_group: `pass_${pass.id}_${user.id}`,
              metadata: piMetadata,
            },
          );
          break;
        case "RECREATE":
          intent = null;
          break;
      }
    }

    if (intent === null) {
      // Only key on priorPiId (canceled-PI rotation: a retry must return the
      // same replacement PI). For brand-new or dead-row-rebook creates we
      // intentionally omit the key — a fixed content-hash fallback would
      // collide across cancel→rebook cycles for the same pass, making
      // Stripe's 24h idempotency cache return the original refunded PI
      // instead of a fresh one.
      const createOpts: Stripe.RequestOptions = priorPiId
        ? { idempotencyKey: `pass:${pass.id}:${user.id}:${priorPiId}` }
        : {};
      intent = await stripe.paymentIntents.create(
        {
          amount: totalAmount,
          currency: pass.currency.toLowerCase(),
          customer_account: student.stripe_account_id,
          transfer_group: `pass_${pass.id}_${user.id}`,
          automatic_payment_methods: { enabled: true },
          metadata: piMetadata,
        },
        createOpts,
      );
    }

    // Bind the held purchase row to the PI. From here on the state machine
    // (util.apply_pi_status_pass) governs status transitions.
    await sql`
      UPDATE public.pass_purchases
      SET stripe_payment_intent_id = ${intent.id}
      WHERE id = ${purchaseId}
    `;

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
