import postgres from "postgres";
import {
  authenticateRequest,
  createServiceRoleClient,
} from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { user } = await authenticateRequest(req);
    const supabase = createServiceRoleClient();
    const userId = user.id;

    // ── 1. Ban user — locked out immediately ────────────────────────────
    const { error: banError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        ban_duration: "876600h",
      },
    );
    if (banError) throw banError;

    // ── 2. Enqueue deletion job for async processing ────────────────────
    await sql`
      SELECT pgmq.send(
        queue_name => 'account_deletion_jobs',
        msg => jsonb_build_object('id', ${userId}::text)
      )
    `;

    return jsonResponse({ success: true });
  } catch (err) {
    const { message, status } = handleError("Delete Account Error", err);
    return jsonResponse({ error: message }, status);
  }
});
