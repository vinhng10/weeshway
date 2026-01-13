import Stripe from "stripe";
import { authenticateAndGetStripeAccount } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Clients & Helpers ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// --- 2. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Authenticate and get Stripe account ID
    const { stripeAccountId } = await authenticateAndGetStripeAccount(req);

    // Generate a one-time use URL for the Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return jsonResponse({ url: loginLink.url });
  } catch (error: unknown) {
    const { message, status } = handleError("Dashboard Link Error", error);
    return jsonResponse({ error: message }, status);
  }
});
