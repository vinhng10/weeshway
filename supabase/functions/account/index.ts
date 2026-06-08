import Stripe from "stripe";
import { authenticateAndGetStripeAccount } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// Onboarding lifecycle, derived from the connected account state:
// - completed:     charges + payouts enabled, ready to receive money
// - action_needed: details submitted but Stripe needs more info from the teacher
// - pending:       details submitted, identity verification in progress (just wait)
// - not_started:   teacher hasn't completed the hosted onboarding yet
//
// Edge functions can't import app code, so this mirrors ONBOARDING_STATUS in
// constants/index.ts — keep the two in sync.
type OnboardingStatus =
  | "completed"
  | "action_needed"
  | "pending"
  | "not_started";

function deriveStatus(
  account: Stripe.Account,
  onboardingCompleted: boolean,
): OnboardingStatus {
  if (onboardingCompleted) return "completed";
  if (!account.details_submitted) return "not_started";

  // Details are in, but capabilities aren't active yet. If Stripe is asking
  // for anything, the teacher must act; otherwise it's just verifying.
  const req = account.requirements;
  const needsAction =
    (req?.currently_due?.length ?? 0) > 0 ||
    (req?.past_due?.length ?? 0) > 0 ||
    (req?.errors?.length ?? 0) > 0;

  return needsAction ? "action_needed" : "pending";
}

// --- 2. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Authenticate and get Stripe account ID
    const { supabase, user, stripeAccountId } =
      await authenticateAndGetStripeAccount(req);

    // Retrieve the connected account with external accounts expanded
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Determine if onboarding is complete
    const onboardingCompleted =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    const status = deriveStatus(account, onboardingCompleted);

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

    // Sync onboarding status to profile. The account.updated webhook keeps this
    // fresh asynchronously; this write covers the case where the teacher opens
    // the wallet before the webhook lands.
    if (onboardingCompleted) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    }

    return jsonResponse({
      onboardingCompleted,
      status,
      externalAccounts,
    });
  } catch (error: unknown) {
    // Handle Stripe-specific error for missing account configuration
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === "v2_account_missing_configuration") {
        return jsonResponse(
          {
            onboardingCompleted: false,
            status: "not_started" satisfies OnboardingStatus,
            externalAccounts: [],
          },
          200,
        );
      }
    }
    const { message, status } = handleError("Retrieve Account Error", error);
    return jsonResponse({ error: message }, status);
  }
});
