import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest, createServiceRoleClient } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

type Fees = { spotFee: number; stripeFee: number; usdRates: Record<string, number> };

async function getFees(): Promise<Fees> {
  const defaults = { spotFee: 50, stripeFee: 5, usdRates: {} as Record<string, number> };
  try {
    const supabase = createServiceRoleClient();
    const [{ data }, ratesRes] = await Promise.all([
      supabase.from("fees").select("key, value"),
      fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
      ),
    ]);
    const rates = await ratesRes.json();
    const map = Object.fromEntries(
      (data ?? []).map((r: { key: string; value: number }) => [r.key, r.value])
    );
    return {
      spotFee: map.spot_fee ?? defaults.spotFee,
      stripeFee: map.stripe_fee ?? defaults.stripeFee,
      usdRates: rates.usd ?? {},
    };
  } catch {
    return defaults;
  }
}

// Triangulate any pair through USD: rate(A→B) = rate(USD→B) / rate(USD→A)
function exchange(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  usdRates: Record<string, number>
): number {
  if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) return amount;
  const from = fromCurrency.toLowerCase();
  const to = toCurrency.toLowerCase();
  const rateFrom = from === "usd" ? 1 : usdRates[from];
  const rateTo = to === "usd" ? 1 : usdRates[to];
  if (!rateFrom || !rateTo) return amount;
  return Math.round(amount * (rateTo / rateFrom));
}

const requestSchema = z.object({
  projectId: z.number().positive(),
  spots: z.number().positive().default(1),
});

Deno.serve(async (req) => {
  try {
    const { supabase, user } = await authenticateRequest(req);

    // 1. Parse & Validate Input
    const body = await req.json();
    const { projectId, spots } = requestSchema.parse(body);

    // 2. Fetch Data
    // Refactored: We now fetch a SINGLE booking for this user/project pair
    const [{ data: customer }, { data: project }, { data: bookings }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, stripe_account_id")
          .eq("id", user.id)
          .single()
          .throwOnError(),
        supabase
          .from("projects")
          .select(
            "id, price, currency, spots, teacher:profiles!inner(stripe_account_id)"
          )
          .eq("id", projectId)
          .single()
          .throwOnError(),
        supabase
          .from("bookings")
          .select("id, user_id, spots, stripe_payment_intent_id, status")
          .eq("project_id", projectId)
          // We fetch Succeeded (for capacity) and Processing (for the current user's retry logic)
          .in("status", ["Succeeded", "Processing"]),
      ]);

    // 3. Guards
    const teacherStripeId = (
      Array.isArray(project.teacher) ? project.teacher[0] : project.teacher
    )?.stripe_account_id;

    if (!customer?.stripe_account_id)
      throw new HttpError("You cannot make payments yet", 406);
    if (!teacherStripeId)
      throw new HttpError("Teacher cannot receive payments yet", 406);
    if (!project.price || project.price <= 0)
      throw new HttpError("Class price is invalid", 406);

    // 4. Availability Check
    // Note: To be strictly accurate, we should query ALL Succeeded bookings for this project
    // to count spots, not just the current user's.
    const existingBooking = bookings?.find((b) => b.user_id === user.id);

    const occupiedSpots =
      bookings
        ?.filter((b) => b.status === "Succeeded")
        .reduce((acc, b) => acc + (b.spots || 0), 0) || 0;
    const remainingSpots = (project.spots || 0) - occupiedSpots;

    if (spots > remainingSpots) {
      throw new HttpError(
        remainingSpots > 0
          ? `Only ${remainingSpots} spots left`
          : "Class is already full",
        406
      );
    }

    // 5. Check Existing Booking Status
    // If the user already has a Succeeded booking, we return it immediately.
    if (existingBooking?.status === "Succeeded") {
      return jsonResponse({
        status: "succeeded",
        customerId: customer.stripe_account_id,
      });
    }

    // 6. Calculate Financials
    const fees = await getFees();
    const feePerSpot = exchange(fees.spotFee, "USD", project.currency, fees.usdRates);
    const spotAmount = project.price * spots;
    const feeAmount = feePerSpot * spots;
    const totalAmount = spotAmount + feeAmount;
    const fee = Math.round(totalAmount * (fees.stripeFee / 100)) + feeAmount;

    // 7. Execute Stripe Operations
    const session = await stripe.customerSessions.create({
      customer_account: customer.stripe_account_id,
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

    let intent: Stripe.PaymentIntent;

    // DECISION LOGIC:
    // We update the existing intent ONLY if the status is 'Processing'.
    // If the status is 'Canceled', 'Refunded', or 'Failed', we ignore the old intent
    // and create a fresh one (which will overwrite the DB row via webhook).
    const isRetryable =
      existingBooking?.status === "Processing" &&
      existingBooking.stripe_payment_intent_id;

    if (isRetryable) {
      // -- Path A: Update Existing Intent --
      if (existingBooking.spots !== spots) {
        intent = await stripe.paymentIntents.update(
          existingBooking.stripe_payment_intent_id,
          {
            amount: totalAmount,
            application_fee_amount: fee,
            metadata: { user_id: customer.id, project_id: project.id, spots },
          }
        );
        // We manually update spots here for immediate UI consistency,
        // though the webhook would eventually do it too.
        await supabase
          .from("bookings")
          .update({ spots })
          .eq("id", existingBooking.id);
      } else {
        intent = await stripe.paymentIntents.retrieve(
          existingBooking.stripe_payment_intent_id
        );
      }
    } else {
      // -- Path B: Create New Intent --
      // (Used for new users OR users retrying after Cancel/Refund/Fail)
      intent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: project.currency.toLowerCase(),
        customer_account: customer.stripe_account_id,
        application_fee_amount: fee,
        transfer_data: { destination: teacherStripeId },
        automatic_payment_methods: { enabled: true },
        metadata: {
          user_id: customer.id,
          project_id: project.id,
          spots,
        },
      });
    }

    return jsonResponse({
      customerId: customer.stripe_account_id,
      paymentIntentClientSecret: intent.client_secret,
      customerSessionClientSecret: session.client_secret,
      status: intent.status,
    });
  } catch (error) {
    const { message, status } = handleError("Payment Intent Error", error);
    return jsonResponse({ error: message }, status);
  }
});
