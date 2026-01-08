import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const requestSchema = z.object({
  projectId: z.number().positive(),
});

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Authenticate user
    const { supabase, user } = await authenticateRequest(req);

    // Validation
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) throw new Error(result.error.message);

    const { projectId } = result.data;

    // Fetch user profile and project details from database
    const [profileResult, projectResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, stripe_account_id")
        .eq("id", user.id)
        .single(),
      supabase
        .from("projects")
        .select(
          "id, price, currency, profile:profiles!inner(stripe_account_id)"
        )
        .eq("id", projectId)
        .single(),
    ]);

    if (profileResult.error) throw new Error("Failed to fetch user profile");
    if (projectResult.error) throw new Error("Failed to fetch project");

    const customer = profileResult.data;
    const project = projectResult.data;

    if (!customer.stripe_account_id) {
      throw new Error("Customer Stripe account not set up");
    }

    // Teacher profile (single profile per project)
    const teacher = (
      Array.isArray(project.profile) ? project.profile[0] : project.profile
    ) as { stripe_account_id: string } | null | undefined;

    if (!teacher?.stripe_account_id) {
      throw new Error("Teacher Stripe account not set up");
    }

    if (!project.price || project.price <= 0) {
      throw new Error("Invalid project price");
    }

    const amount = project.price + 50; // Add fee
    const currency = project.currency;
    const applicationFeeAmount = Math.round(amount * 0.05) + 50;

    // Check for existing booking
    const { data: booking, error: dbError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", customer.id)
      .eq("project_id", project.id)
      .maybeSingle();

    if (dbError) throw dbError;

    // Handle already paid state
    if (booking?.status === "Succeeded") {
      return jsonResponse({
        customerId: customer.stripe_account_id,
        paymentIntentClientSecret: "",
        customerSessionClientSecret: "",
        status: "succeeded",
      });
    }

    // Concurrent Stripe Operations: Create Session and Get/Create Intent
    const [customerSession, paymentIntent] = await Promise.all([
      stripe.customerSessions.create({
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
      }),
      booking?.stripe_payment_intent_id && booking.status !== "Canceled"
        ? stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
        : stripe.paymentIntents.create({
            amount,
            currency: currency.toLowerCase(),
            customer_account: customer.stripe_account_id,
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFeeAmount,
            transfer_data: { destination: teacher.stripe_account_id },
            metadata: { user_id: customer.id, project_id: project.id },
          }),
    ]);

    return jsonResponse({
      customerId: customer.stripe_account_id,
      paymentIntentClientSecret: paymentIntent.client_secret,
      customerSessionClientSecret: customerSession.client_secret,
      status: paymentIntent.status,
    });
  } catch (err: unknown) {
    const { message, status } = handleError("Payment Intent Error", err);
    return jsonResponse({ error: message }, status);
  }
});
