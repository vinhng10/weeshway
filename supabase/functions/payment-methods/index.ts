import Stripe from "stripe";
import { authenticateAndGetStripeAccount } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// --- 2. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Authenticate and get Stripe account ID
    const { stripeAccountId } = await authenticateAndGetStripeAccount(req);

    // Fetch all payment methods (no limit = get all)
    const { data } = await stripe.customers.listPaymentMethods(
      stripeAccountId,
      {
        type: "card",
      }
    );

    // Extract only card brand and last4
    const paymentMethods = data.map((pm) => ({
      brand: pm.card!.brand,
      last4: pm.card!.last4,
    }));

    return jsonResponse({ paymentMethods });
  } catch (error: unknown) {
    const { message, status } = handleError(
      "List Payment Methods Error",
      error
    );
    return jsonResponse({ error: message }, status);
  }
});
