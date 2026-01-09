import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
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

    // 2. Fetch Data (Using .throwOnError() to reduce boilerplate)
    const [{ data: customer }, { data: project }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, stripe_account_id")
        .eq("id", user.id)
        .single()
        .throwOnError(),
      supabase
        .from("projects")
        .select(
          "id, price, currency, teacher:profiles!inner(stripe_account_id)"
        )
        .eq("id", projectId)
        .single()
        .throwOnError(),
    ]);

    // 3. Guards
    // teacher:profiles!inner always returns an array
    const teacherStripeId = (
      Array.isArray(project.teacher) ? project.teacher[0] : project.teacher
    )?.stripe_account_id;

    if (!customer?.stripe_account_id)
      throw new Error("Customer Stripe account not set up");
    if (!teacherStripeId) throw new Error("Teacher Stripe account not set up");
    if (!project.price || project.price <= 0)
      throw new Error("Invalid project price");

    // 4. Check Existing Booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .match({ user_id: customer.id, project_id: project.id })
      .maybeSingle();

    if (booking?.status === "Succeeded") {
      return jsonResponse({
        status: "succeeded",
        customerId: customer.stripe_account_id,
      });
    }

    // 5. Calculate Financials
    const spotAmount = project.price * spots;
    const feeAmount = 50 * spots;
    const totalAmount = spotAmount + feeAmount;
    const fee = Math.round(totalAmount * 0.05) + feeAmount;

    // 6. Execute Stripe Operations
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

    if (booking?.stripe_payment_intent_id && booking.status !== "Canceled") {
      if (spotsChanged) {
        // Try to update existing payment intent with new amount
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
          }
        );
        await supabase.from("bookings").update({ spots }).eq("id", booking.id);
      } else {
        // Just retrieve existing payment intent
        intent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id
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
  } catch (err) {
    const { message, status } = handleError("Payment Intent Error", err);
    return jsonResponse({ error: message }, status);
  }
});
