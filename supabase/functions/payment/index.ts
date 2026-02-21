import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { exchange, getFees } from "../_shared/fees.ts";
import { jsonResponse } from "../_shared/response.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

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
    const feePerSpot = exchange(
      fees.bookingFee,
      "USD",
      project.currency,
      fees.usdRates
    );
    const price = project.price * spots;
    const bookingFee = feePerSpot * spots;
    const total = price + bookingFee;
    const fee = Math.round(price * (fees.transactionFee / 100)) + bookingFee;

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
            amount: total,
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
      // Clear any stale refund_initiator from a previous refund on this booking.
      await supabase
        .from("bookings")
        .update({ refund_initiator: null })
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .in("status", ["Refunded", "Canceled", "Failed"]);

      intent = await stripe.paymentIntents.create({
        amount: total,
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
