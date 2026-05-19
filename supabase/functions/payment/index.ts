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
  projectId: z.uuidv7(),
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
            "id, price, currency, spots, end_at, teacher:profiles!inner(stripe_account_id)",
          )
          .eq("id", projectId)
          .single()
          .throwOnError(),
        supabase
          .from("bookings")
          .select("id, user_id, spots, stripe_payment_intent_id, status")
          .eq("project_id", projectId)
          // We fetch Succeeded (for capacity) and Created (for the current user's retry logic)
          .in("status", ["Succeeded", "Created", "CheckedIn", "Transferred"]),
      ]);

    // 3. Guards
    const toStripeAccountId = (
      Array.isArray(project.teacher) ? project.teacher[0] : project.teacher
    )?.stripe_account_id;

    if (!customer?.stripe_account_id)
      throw new HttpError("You cannot make payments yet", 406);
    if (!toStripeAccountId)
      throw new HttpError("Teacher cannot receive payments yet", 406);
    if (!project.price || project.price <= 0)
      throw new HttpError("Class price is invalid", 406);
    if (project.end_at && new Date(project.end_at) < new Date())
      throw new HttpError("This class has already ended", 406);

    // 4. Availability Check
    // Note: To be strictly accurate, we should query ALL Succeeded bookings for this project
    // to count spots, not just the current user's.
    const existingBooking = bookings?.find((b) => b.user_id === user.id);

    const occupiedSpots =
      bookings
        ?.filter((b) =>
          ["Succeeded", "CheckedIn", "Transferred"].includes(b.status),
        )
        .reduce((acc, b) => acc + (b.spots || 0), 0) || 0;
    const remainingSpots = (project.spots || 0) - occupiedSpots;

    if (spots > remainingSpots) {
      throw new HttpError(
        remainingSpots > 0
          ? `Only ${remainingSpots} spots left`
          : "Class is already full",
        406,
      );
    }

    // 5. Check Existing Booking Status
    // If the user already has a Succeeded booking, we return it immediately.
    if (
      existingBooking &&
      ["Succeeded", "CheckedIn", "Transferred"].includes(existingBooking.status)
    ) {
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
      fees.usdRates,
    );
    const price = project.price * spots;
    const bookingFee = feePerSpot * spots;
    const total = price + bookingFee;

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
    // We update the existing intent ONLY if the status is 'Created'.
    // If the status is 'Canceled', 'Refunded', or 'Failed', we ignore the old intent
    // and create a fresh one (which will overwrite the DB row via webhook).
    const isRetryable =
      existingBooking?.status === "Created" &&
      existingBooking.stripe_payment_intent_id;

    if (isRetryable) {
      // -- Path A: Update Existing Intent --
      if (existingBooking.spots !== spots) {
        intent = await stripe.paymentIntents.update(
          existingBooking.stripe_payment_intent_id,
          {
            amount: total,
            transfer_group: `booking_${project.id}_${user.id}`,
            metadata: {
              user_id: customer.id,
              project_id: project.id,
              spots,
              price: project.price,
              currency: project.currency,
              to_stripe_account_id: toStripeAccountId,
              end_at: project.end_at,
            },
          },
        );
        // We manually update spots here for immediate UI consistency,
        // though the webhook would eventually do it too.
        await supabase
          .from("bookings")
          .update({ spots })
          .eq("id", existingBooking.id);
      } else {
        intent = await stripe.paymentIntents.retrieve(
          existingBooking.stripe_payment_intent_id,
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
        transfer_group: `booking_${project.id}_${user.id}`,
        automatic_payment_methods: { enabled: true },
        metadata: {
          user_id: customer.id,
          project_id: project.id,
          spots,
          price: project.price,
          currency: project.currency,
          to_stripe_account_id: toStripeAccountId,
          end_at: project.end_at,
        },
      });
    }

    const stripeEnabled = await flagEnabled(sql, "stripe");

    if (!stripeEnabled) {
      // Upsert the booking synchronously so the client can refetch immediately.
      // The webhook will later fire payment_intent.created and no-op (same intent, same status).
      const serviceClient = createServiceRoleClient();
      await serviceClient.from("bookings").upsert(
        {
          stripe_payment_intent_id: intent.id,
          status: "Succeeded",
          user_id: user.id,
          project_id: projectId,
          spots,
          price: project.price,
          currency: project.currency,
          to_stripe_account_id: toStripeAccountId,
          project_end_at: project.end_at,
          pass_purchase_id: null,
        },
        { onConflict: "user_id,project_id" },
      );

      return jsonResponse({
        customerId: customer.stripe_account_id,
        paymentIntentClientSecret: intent.client_secret,
        customerSessionClientSecret: session.client_secret,
        autoConfirmed: true,
        status: "succeeded",
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
