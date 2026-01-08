import Stripe from "stripe";
import { z } from "zod";
import { createServiceRoleClient } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Clients & Configuration ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createServiceRoleClient();

const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET_KEY");

const requestSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
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
  } catch (err: unknown) {
    console.error("Stripe Account Creation Error:", err);

    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message }, status);
  }
});
