import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";
import { z } from "npm:zod";

// --- 1. Clients & Configuration ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET_KEY");

const requestSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
});

const jsonResponse = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- 2. Main Handler ---
Deno.serve(async (req) => {
  // Security & Method Guards
  if (req.headers.get("X-Internal-Secret-Key") !== INTERNAL_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { userId, email } = requestSchema.parse(body);

    // 1. Create Stripe Account (v2 API)
    const account = await stripe.v2.core.accounts.create({
      contact_email: email,
      configuration: {
        customer: {
          capabilities: { automatic_indirect_tax: { requested: true } },
        },
      },
      metadata: { supabase_user_id: userId },
    });

    // 2. Link to Supabase Profile
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ stripe_account_id: account.id })
      .eq("id", userId);

    // 3. Atomic Rollback: If DB update fails, close the Stripe account
    if (dbError) {
      await stripe.v2.core.accounts.close(account.id, {
        applied_configurations: ["customer"],
      });
      throw new Error(`Profile sync failed: ${dbError.message}`);
    }

    return jsonResponse({ accountId: account.id });
  } catch (err: any) {
    console.error("Stripe Account Creation Error:", err.message);

    const status = err instanceof z.ZodError ? 400 : 500;
    return jsonResponse(
      { error: err.message || "Internal Server Error" },
      status
    );
  }
});
