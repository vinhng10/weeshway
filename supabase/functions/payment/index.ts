// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^20.1.0";
import { z } from "npm:zod";

const requestSchema = z.object({
  customerId: z.string(),
  accountId: z.string(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  applicationFeeAmount: z.number().nonnegative(),
});

Deno.serve(async (req: Request) => {
  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");

    // Parse and validate request body
    const parseResult = requestSchema.safeParse(await req.json());

    if (parseResult.error) {
      return new Response(
        JSON.stringify({
          error: `Invalid request body: ${parseResult.error.message}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { customerId, accountId, amount, currency, applicationFeeAmount } =
      parseResult.data;

    // Create customer session for mobile payment element
    const customerSession = await stripe.customerSessions.create({
      customer_account: customerId,
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer_account: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: accountId,
      },
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        customerSessionClientSecret: customerSession.client_secret,
        customer: customerId,
        customerAccount: customerId,
        publishableKey: publishableKey,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Error creating payment intent:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
