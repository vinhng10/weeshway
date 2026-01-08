import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^20.1.0";
import { authenticateAndGetStripeAccount } from "../_shared/auth.ts";
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
  } catch (err: any) {
    console.error("Dashboard Link Error:", err.message);
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
});
