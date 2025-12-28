import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^20.1.0";

// --- 1. Clients & Helpers ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 2. Main Handler ---
Deno.serve(async (req: Request) => {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return jsonResponse({ error: "accountId is required" }, 400);
    }

    // Generate a one-time use URL for the Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return jsonResponse({ url: loginLink.url });
  } catch (err: any) {
    console.error("Dashboard Link Error:", err.message);
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
});
