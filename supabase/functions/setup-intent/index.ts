import Stripe from "stripe";
import { authenticateAndGetStripeAccount } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Authenticate and get Stripe account ID
    const { stripeAccountId } = await authenticateAndGetStripeAccount(req);

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer_account: stripeAccountId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return jsonResponse({
      setupIntentClientSecret: setupIntent.client_secret,
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Setup Intent Error", error);
    return jsonResponse({ error: message }, status);
  }
});
