// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import Stripe from "npm:stripe@^20.1.0";

Deno.serve(async (req: Request) => {
  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

    // Parse request body
    const { accountId } = await req.json();

    if (!accountId) {
      return new Response(
        JSON.stringify({
          error: "accountId is required in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create login link for Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return new Response(JSON.stringify({ url: loginLink.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error creating dashboard login link:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
