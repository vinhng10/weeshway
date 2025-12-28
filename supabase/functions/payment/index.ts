import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";
import { z } from "npm:zod";

// --- 1. Configuration & Clients ---
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_PUBLISHABLE_KEY = Deno.env.get("STRIPE_PUBLISHABLE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const requestSchema = z.object({
  customer: z.object({ id: z.string(), stripeAccountId: z.string() }),
  project: z.object({ id: z.number(), stripeAccountId: z.string() }),
  amount: z.number().positive(),
  currency: z.string().length(3),
  applicationFeeAmount: z.number().nonnegative(),
});

// --- 2. Helper Utilities ---
const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Validation
    const body = await req.json().catch(() => ({}));
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return jsonResponse({ error: result.error.format() }, 400);
    }

    const { customer, project, amount, currency, applicationFeeAmount } =
      result.data;

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
      return jsonResponse({ message: "Payment already succeeded" });
    }

    // Concurrent Stripe Operations: Create Session and Get/Create Intent
    const [customerSession, paymentIntent] = await Promise.all([
      stripe.customerSessions.create({
        customer_account: customer.stripeAccountId,
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
      booking?.stripe_payment_intent_id
        ? stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
        : stripe.paymentIntents.create({
            amount,
            currency,
            customer_account: customer.stripeAccountId,
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFeeAmount,
            transfer_data: { destination: project.stripeAccountId },
            metadata: { user_id: customer.id, project_id: project.id },
          }),
    ]);

    return jsonResponse({
      paymentIntent: paymentIntent.client_secret,
      customerSessionClientSecret: customerSession.client_secret,
      customer: customer.id,
      customerAccount: customer.stripeAccountId,
      publishableKey: STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err: any) {
    console.error("Payment Intent Error:", err);
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
});
