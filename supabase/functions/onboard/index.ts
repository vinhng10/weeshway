import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest, getUserProfile } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Global Clients ---
// Initializing outside the handler enables "warm start" performance gains.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const requestSchema = z.object({
  country: z.string(),
  returnUrl: z.url(),
});

// --- 2. Main Handler ---
Deno.serve(async (req: Request) => {
  try {
    // A. Authenticate User
    const { supabase, user } = await authenticateRequest(req);

    // B. Validate Input
    const body = await req.json();
    const { country, returnUrl } = requestSchema.parse(body);

    // C. Get Stripe Account ID from Profile
    const profile = await getUserProfile(supabase, user.id);
    const accountId = profile.stripe_account_id;

    if (!accountId) {
      throw new HttpError(
        "Stripe account not found. Please sign up first.",
        404,
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
          fees_collector: "application",
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
  } catch (error: unknown) {
    const { message, status } = handleError("Onboarding Error", error);
    return jsonResponse({ error: message }, status);
  }
});
