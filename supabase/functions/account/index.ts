import Stripe from "stripe";
import { authenticateAndGetStripeAccount } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// --- 2. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Authenticate and get Stripe account ID
    const { stripeAccountId } = await authenticateAndGetStripeAccount(req);

    // Retrieve the connected account with external accounts expanded
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Determine if onboarding is complete
    const onboardingComplete =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    // Extract external accounts (bank accounts)
    const externalAccounts =
      account.external_accounts?.data
        .filter((ea) => ea.object === "bank_account")
        .map((ea) => {
          const bankAccount = ea as Stripe.BankAccount;
          return {
            bankName: bankAccount.bank_name || null,
            currency: bankAccount.currency,
            last4: bankAccount.last4,
          };
        }) || [];

    return jsonResponse({
      onboardingComplete,
      externalAccounts,
    });
  } catch (error: unknown) {
    // Handle Stripe-specific error for missing account configuration
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === "v2_account_missing_configuration") {
        return jsonResponse(
          { onboardingComplete: false, externalAccounts: [] },
          200
        );
      }
    }
    const { message, status } = handleError("Retrieve Account Error", error);
    return jsonResponse({ error: message }, status);
  }
});
