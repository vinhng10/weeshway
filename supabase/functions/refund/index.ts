import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const jobSchema = z.object({
  jobId: z.number(),
  id: z.number(),
});
const failedJobSchema = jobSchema.extend({
  error: z.string(),
});
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

// --- 2. Core Logic Helpers ---
/**
 * Processes a single refund job atomically
 */
async function processJob(job: Job) {
  return await sql.begin(async () => {
    // 1. Fetch booking data with project price to calculate refund amount
    const [booking] = await sql`
      SELECT b.id, b.stripe_payment_intent_id, b.spots, p.price
      FROM public.bookings b
      JOIN public.projects p ON p.id = b.project_id
      WHERE b.id = ${job.id} AND b.status = 'Refunding'
      FOR UPDATE
    `;

    if (!booking) {
      throw new HttpError(
        `Booking ${job.id} not found or not in Refunding status`,
        404
      );
    }

    if (!booking.stripe_payment_intent_id) {
      throw new HttpError(`Booking ${job.id} has no payment intent`, 400);
    }

    // Refund only the class price (spots × price), keeping the spot fee
    const refundAmount = booking.spots * booking.price;

    // 2. Create Stripe refund — keep spot fee, return class price to student
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: refundAmount,
      reverse_transfer: true,
      refund_application_fee: false,
      metadata: {
        jobId: job.jobId.toString(),
        bookingId: booking.id.toString(),
      },
    });

    return { ...job, refundId: refund.id, status: refund.status };
  });
}

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  try {
    // Guard Clauses
    authenticateInternalRequest(req);

    if (req.method !== "POST") {
      throw new HttpError("Method Not Allowed", 405);
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

    const completedJobs: Array<
      Job & { refundId: string; status: string | null }
    > = [];
    const failedJobs: FailedJob[] = [];

    // Process jobs sequentially (refunds should be handled carefully)
    for (const job of pendingJobs) {
      try {
        const result = await processJob(job);
        completedJobs.push(result);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        failedJobs.push({ ...job, error: message });
      }
    }

    return jsonResponse({
      completed: completedJobs.length,
      failed: failedJobs.length,
      details: { completedJobs, failedJobs },
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Refund Processing Error", error);
    return jsonResponse({ error: message }, status);
  }
});
