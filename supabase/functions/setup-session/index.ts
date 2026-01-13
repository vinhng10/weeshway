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

    // Create customer session
    const customerSession = await stripe.customerSessions.create({
      customer_account: stripeAccountId,
      components: {
        customer_sheet: {
          enabled: true,
          features: {
            payment_method_remove: "enabled",
          },
        },
      },
    });

    return jsonResponse({
      customerId: stripeAccountId,
      clientSecret: customerSession.client_secret,
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Setup Session Error", error);
    return jsonResponse({ error: message }, status);
  }
});
