import {
  createClient,
  SupabaseClient,
  User,
} from "npm:@supabase/supabase-js@2";

export type AuthContext = {
  supabase: SupabaseClient;
  user: User;
};

export type ProfileWithStripe = {
  id: string;
  stripe_account_id: string | null;
};

/**
 * Authenticates the request and returns the Supabase client and user
 */
export async function authenticateRequest(req: Request): Promise<AuthContext> {
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

  return { supabase, user };
}

/**
 * Gets the authenticated user's profile with Stripe account ID
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileWithStripe> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, stripe_account_id")
    .eq("id", userId)
    .single();

  if (profileError) throw new Error("Failed to fetch user profile");

  return profile;
}

/**
 * Gets the authenticated user's Stripe account ID
 * Throws if the account is not set up
 */
export async function getStripeAccountId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const profile = await getUserProfile(supabase, userId);

  if (!profile.stripe_account_id) {
    throw new Error("Stripe account not set up");
  }

  return profile.stripe_account_id;
}

/**
 * All-in-one: Authenticate and get Stripe account ID
 */
export async function authenticateAndGetStripeAccount(
  req: Request
): Promise<{ supabase: SupabaseClient; user: User; stripeAccountId: string }> {
  const { supabase, user } = await authenticateRequest(req);
  const stripeAccountId = await getStripeAccountId(supabase, user.id);

  return { supabase, user, stripeAccountId };
}

/**
 * Creates a Supabase client with service role key (bypasses RLS)
 * Use this for server-side operations that require elevated permissions
 */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}
