import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^20.1.0";
import { z } from "npm:zod";

// --- 1. Configuration & Clients ---
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY);

const requestSchema = z.object({
  stripeAccountId: z.string(),
});

// --- 2. Helper Utilities ---
const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Validation
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return jsonResponse({ error: z.treeifyError(result.error) }, 400);
    }

    const { stripeAccountId } = result.data;

    // Concurrent Stripe Operations: Create Session and Get/Create Intent
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
  } catch (err: any) {
    console.error("Setup Intent Error:", err);
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
});
