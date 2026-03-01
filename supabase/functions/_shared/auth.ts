import * as jose from "jose";
import { createClient, SupabaseClient, User } from "supabase";
import { HttpError } from "./errors.ts";

const SUPABASE_JWT_ISSUER =
  Deno.env.get("SB_JWT_ISSUER") ?? Deno.env.get("SUPABASE_URL") + "/auth/v1";

const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(Deno.env.get("SUPABASE_URL")! + "/auth/v1/.well-known/jwks.json"),
);

export type AuthContext = {
  supabase: SupabaseClient;
  user: User;
};

export type ProfileWithStripe = {
  id: string;
  stripe_account_id: string | null;
};

/**
 * Extracts the Bearer token from the Authorization header
 * Returns both the full header and the token
 */
function getAuthToken(req: Request): { header: string; token: string } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer") {
    throw new Error(`Auth header is not 'Bearer {token}'`);
  }
  return { header: authHeader, token };
}

/**
 * Verifies the Supabase JWT token using asymmetric key verification
 * Throws an error if the token is invalid
 */
async function verifySupabaseJWT(jwt: string) {
  return await jose.jwtVerify(jwt, SUPABASE_JWT_KEYS, {
    issuer: SUPABASE_JWT_ISSUER,
  });
}

/**
 * Authenticates client-facing requests using JWT verification
 * For use in edge functions that are called directly by clients
 */
export async function authenticateRequest(req: Request): Promise<AuthContext> {
  // Extract and verify JWT token
  const { header: authHeader, token } = getAuthToken(req);

  try {
    await verifySupabaseJWT(token);
  } catch (_error) {
    throw new HttpError("Unauthorized", 401);
  }

  // Create authenticated Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SB_PUBLISHABLE_KEY")!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    },
  );

  // Retrieve user from authenticated session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new HttpError("Unauthorized", 401);
  }

  return { supabase, user };
}

/**
 * Authenticates backend-only requests using X-Internal-Secret-Key header
 * For use in edge functions that are only called by your backend services
 * (e.g., cron jobs, internal webhooks, scheduled tasks)
 */
export function authenticateInternalRequest(req: Request): void {
  const secretKey = req.headers.get("X-Internal-Secret-Key");
  const expectedSecret = Deno.env.get("INTERNAL_SECRET_KEY");

  if (!secretKey || !expectedSecret) {
    throw new HttpError("Missing internal secret key", 401);
  }

  if (secretKey !== expectedSecret) {
    throw new HttpError("Unauthorized", 403);
  }
}

/**
 * Gets the authenticated user's profile with Stripe account ID
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileWithStripe> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, stripe_account_id")
    .eq("id", userId)
    .single();

  if (profileError) throw new HttpError("Failed to fetch user profile", 500);

  return profile;
}

/**
 * Gets the authenticated user's Stripe account ID
 * Throws if the account is not set up
 */
export async function getStripeAccountId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const profile = await getUserProfile(supabase, userId);

  if (!profile.stripe_account_id) {
    throw new HttpError("Stripe account not set up", 404);
  }

  return profile.stripe_account_id;
}

/**
 * All-in-one: Authenticate and get Stripe account ID
 */
export async function authenticateAndGetStripeAccount(
  req: Request,
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
    Deno.env.get("SB_SECRET_KEY")!,
  );
}
