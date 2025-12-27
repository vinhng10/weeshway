// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.1.0";
import { z } from "npm:zod";

const requestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
});

Deno.serve(async (req: Request) => {
  try {
    if (
      req.headers.get("X-Internal-Secret-Key") !==
      Deno.env.get("INTERNAL_SECRET_KEY")
    ) {
      return new Response("forbidden", { status: 403 });
    }

    if (req.method !== "POST") {
      return new Response("expected POST request", { status: 405 });
    }

    if (req.headers.get("Content-Type") !== "application/json") {
      return new Response("expected JSON body", { status: 400 });
    }

    // Parse and validate request body
    const parseResult = requestSchema.safeParse(await req.json());

    if (parseResult.error) {
      return new Response(
        `invalid request body: ${parseResult.error.message}`,
        { status: 400 }
      );
    }

    const { userId, email } = parseResult.data;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const account = await stripe.v2.core.accounts.create({
      contact_email: email,
      configuration: {
        customer: {
          capabilities: {
            automatic_indirect_tax: {
              requested: true,
            },
          },
        },
      },
      metadata: {
        supabase_user_id: userId,
      },
    });

    const { error } = await supabaseClient
      .from("profiles")
      .update({ stripe_account_id: account.id })
      .eq("id", userId);

    if (error) {
      await stripe.v2.core.accounts.close(account.id, {
        applied_configurations: ["customer"],
      });
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return new Response(JSON.stringify({ accountId: account.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error creating Stripe account:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
