import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";
import { z } from "npm:zod";

// --- 1. Configuration & Global Clients ---
// Initializing outside the handler enables "warm start" performance gains.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const requestSchema = z.object({
  country: z.string(),
  returnUrl: z.url(),
});

const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 2. Main Handler ---
Deno.serve(async (req: Request) => {
  try {
    // A. Authenticate User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing auth header" }, 401);

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    // B. Validate Input
    const body = await req.json().catch(() => ({}));
    const { country, returnUrl } = requestSchema.parse(body);

    // C. Get Stripe Account ID from Profile
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    const accountId = profile?.stripe_account_id;

    if (dbError || !accountId) {
      return jsonResponse(
        { error: "Stripe account not found. Please sign up first." },
        404
      );
    }

    // D. Stripe Operations
    // We update the account details and then generate the onboarding link.
    // Note: Using the Stripe V2 syntax as per your requirement.
    await stripe.v2.core.accounts.update(accountId, {
      display_name: user.email,
      dashboard: "express",
      defaults: {
        responsibilities: {
          fees_collector: "application_express",
          losses_collector: "application",
        },
      },
      identity: { country },
      configuration: {
        merchant: { capabilities: { card_payments: { requested: true } } },
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
    });

    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "recipient", "customer"],
          refresh_url: returnUrl,
          return_url: returnUrl,
        },
      },
    });

    return jsonResponse({ url: accountLink.url });
  } catch (err: any) {
    console.error("Onboarding Error:", err.message);

    // Check if error is from Zod validation
    if (err instanceof z.ZodError) {
      return jsonResponse({ error: "Invalid returnUrl" }, 400);
    }

    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
});
