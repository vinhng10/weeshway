import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
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
            "id, price, currency, spots, teacher:profiles!inner(stripe_account_id)",
          )
          .eq("id", projectId)
          .single()
          .throwOnError(),
        supabase
          .from("bookings")
          .select("id, user_id, spots, stripe_payment_intent_id, status")
          .eq("project_id", projectId)
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
        406,
      );
    }

    // 5. Check Existing Booking
    const booking = bookings?.find((b) => b.user_id === customer.id);

    if (booking?.status === "Succeeded") {
      return jsonResponse({
        status: "succeeded",
        customerId: customer.stripe_account_id,
      });
    }

    // 6. Calculate Financials
    const spotAmount = project.price * spots;
    const feeAmount = 50 * spots;
    const totalAmount = spotAmount + feeAmount;
    const fee = Math.round(totalAmount * 0.05) + feeAmount;

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

    // Handle payment intent: retrieve, update, or create
    let intent: Stripe.PaymentIntent;
    const spotsChanged = booking && booking.spots !== spots;

    if (booking?.stripe_payment_intent_id && booking.status === "Processing") {
      if (spotsChanged) {
        // Update existing payment intent with new amount
        intent = await stripe.paymentIntents.update(
          booking.stripe_payment_intent_id,
          {
            amount: totalAmount,
            application_fee_amount: fee,
            metadata: {
              user_id: customer.id,
              project_id: project.id,
              spots,
            },
          },
        );
        await supabase.from("bookings").update({ spots }).eq("id", booking.id);
      } else {
        // Retrieve existing payment intent
        intent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id,
        );
      }
    } else {
      // Create new payment intent
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
