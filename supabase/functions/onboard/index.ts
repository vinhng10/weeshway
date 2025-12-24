// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";

Deno.serve(async (req: Request) => {
  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token!);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { returnUrl } = await req.json();

    // Get or create Stripe account
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      // Create a Connect account
      const account = await stripe.v2.core.accounts.create({
        display_name: user.email,
        contact_email: user.email,
        dashboard: "express",
        defaults: {
          responsibilities: {
            fees_collector: "application_express",
            losses_collector: "application",
          },
        },
        identity: {
          country: "FI",
          entity_type: "individual",
        },
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
        },
      });

      accountId = account.id;

      // Update profile with account ID
      await supabaseClient
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant"],
          refresh_url: returnUrl,
          return_url: returnUrl,
        },
      },
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error onboarding:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
