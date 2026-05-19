import postgres from "postgres";
import { SupabaseClient } from "supabase";
import { z } from "zod";
import {
  authenticateInternalRequest,
  createServiceRoleClient,
} from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);

const jobSchema = z.object({
  jobId: z.number(),
  id: z.uuid(),
});
const failedJobSchema = jobSchema.extend({
  error: z.string(),
});
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

// ── Storage cleanup ─────────────────────────────────────────────────────────

async function purgeFolder(
  admin: SupabaseClient,
  bucket: string,
  folder: string,
) {
  const { data: items } = await admin.storage.from(bucket).list(folder);
  if (!items?.length) return;

  const files = items.filter((i) => i.id).map((i) => `${folder}/${i.name}`);
  const subfolders = items
    .filter((i) => !i.id)
    .map((i) => `${folder}/${i.name}`);

  if (files.length) await admin.storage.from(bucket).remove(files);
  await Promise.all(subfolders.map((sub) => purgeFolder(admin, bucket, sub)));

  if (items.length === 1000) await purgeFolder(admin, bucket, folder);
}

// ── Core Logic ──────────────────────────────────────────────────────────────

async function processJob(job: Job, supabase: SupabaseClient) {
  const userId = job.id;

  // ── 0. Already deleted? Skip (handles crash-after-deleteUser) ───────
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (!userData.user) return job;

  // ── 1. Cancel teacher's Released projects ───────────────────────────
  //
  // The handle_project_cancellation trigger sets all Succeeded/CheckedIn
  // bookings to Refunding → validate_refund_eligibility sets
  // refund_initiator = 'Teacher' (bypasses 24h rule) → refund_bookings
  // trigger enqueues to refund_jobs → cron processes Stripe refunds.
  // Idempotent: WHERE status = 'Released' — already canceled projects skipped.

  await sql`
    UPDATE public.projects
    SET status = 'Canceled'
    WHERE user_id = ${userId}
      AND status = 'Released'
  `;

  // ── 2. Student bookings — refund eligible ones ──────────────────────
  //
  // Set each Succeeded/CheckedIn booking to Refunding individually.
  // The validate_refund_eligibility trigger enforces the 24h rule and
  // sets refund_initiator. Ineligible bookings are silently skipped.
  // Idempotent: only targets Succeeded/CheckedIn statuses.

  const studentBookingIds: { id: string }[] = await sql`
    SELECT id FROM public.bookings
    WHERE user_id = ${userId} AND status IN ('Succeeded', 'CheckedIn')
  `;

  for (const { id } of studentBookingIds) {
    await sql`
      UPDATE public.bookings SET status = 'Refunding' WHERE id = ${id}
    `.catch(() => {});
  }

  // ── 2.5. Pass purchases — refund outstanding credits ──────────────
  //
  // Flip Succeeded pass_purchases (remaining_sessions > 0) for THIS TEACHER's
  // passes to Refunding. The validate_pass_refund_eligibility trigger enqueues
  // a teacher-deletion job to pass_refund_jobs for the pass-refund cron.
  // Must run after step 1 so session restorations from canceled future classes
  // are counted before the refund amount is computed.
  // Idempotent: only targets Succeeded rows.

  const outstandingPasses: { id: string }[] = await sql`
    SELECT pp.id
    FROM public.pass_purchases pp
    JOIN public.passes p ON p.id = pp.pass_id
    WHERE p.user_id = ${userId}
      AND pp.status = 'Succeeded'
      AND pp.remaining_sessions > 0
  `;

  for (const { id } of outstandingPasses) {
    await sql`
      UPDATE public.pass_purchases
      SET status = 'Refunding',
          refund_initiator = 'Teacher'::public.role
      WHERE id = ${id}
    `.catch(() => {});
  }

  // ── 3. Storage cleanup ──────────────────────────────────────────────
  // Idempotent: purging empty/missing folders is a no-op.

  const teacherProjectIds: { id: string }[] = await sql`
    SELECT id FROM public.projects WHERE user_id = ${userId}
  `;

  await Promise.all([
    purgeFolder(supabase, "profiles", userId),
    purgeFolder(supabase, "reports", userId),
    ...teacherProjectIds.map((p) => purgeFolder(supabase, "projects", p.id)),
  ]);

  // ── 4. Delete auth user ─────────────────────────────────────────────
  //
  // CASCADE: profile → projects → wishes, watchings deleted
  // SET NULL: bookings.user_id, bookings.project_id anonymized
  // Bookings are self-contained (to_stripe_account_id, project_end_at,
  // price, currency) so refund/transfer crons keep working.

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) throw deleteError;

  return job;
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    authenticateInternalRequest(req);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405);
    }

    const rawBody = await req.json().catch(() => []);
    const result = z.array(jobSchema).safeParse(rawBody);

    if (!result.success) {
      return jsonResponse({ error: z.treeifyError(result.error) }, 400);
    }

    const pendingJobs = result.data;
    if (!pendingJobs.length) {
      return jsonResponse({ completed: 0, failed: 0 });
    }

    const supabase = createServiceRoleClient();
    const completedJobs: Job[] = [];
    const failedJobs: FailedJob[] = [];

    for (const job of pendingJobs) {
      try {
        const completed = await processJob(job, supabase);
        completedJobs.push(completed);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        failedJobs.push({ ...job, error: message });
      }
    }

    // Dequeue successful jobs
    if (completedJobs.length) {
      const jobIds = completedJobs.map((j) => j.jobId);
      await sql`SELECT util.batch_dequeue('account_deletion_jobs', ${jobIds})`;
    }

    return jsonResponse({
      completed: completedJobs.length,
      failed: failedJobs.length,
      details: { completedJobs, failedJobs },
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Deletion Processing Error", error);
    return jsonResponse({ error: message }, status);
  }
});
