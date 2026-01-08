import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";

// --- 1. Configuration & Clients ---
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY);

// --- 2. Helper Utilities ---
const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Get authenticated user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user profile to get Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("Failed to fetch user profile");

    if (!profile.stripe_account_id) {
      throw new Error("Stripe account not set up");
    }

    // Create customer session
    const customerSession = await stripe.customerSessions.create({
      customer_account: profile.stripe_account_id,
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
      customerId: profile.stripe_account_id,
      clientSecret: customerSession.client_secret,
    });
  } catch (err: any) {
    console.error("Setup Session Error:", err);
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
});
