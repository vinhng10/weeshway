import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { getFees } from "../_shared/fees.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const jobSchema = z.object({
  jobId: z.number(),
  booking_id: z.uuid(),
});
const failedJobSchema = jobSchema.extend({ error: z.string() });
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

async function processJob(job: Job): Promise<Job> {
  return await sql.begin(async (tx) => {
    const [b] = await tx`
      SELECT b.id, b.spots, b.to_stripe_account_id, b.stripe_penalty_charge_id,
             pp.price, pp.sessions, pp.currency
      FROM public.bookings b
      JOIN public.pass_purchases pp ON pp.id = b.pass_purchase_id
      WHERE b.id = ${job.booking_id}
      FOR UPDATE OF b
    `;

    if (!b) throw new HttpError("booking not found", 404);
    if (b.stripe_penalty_charge_id) return job; // idempotent

    if (!b.to_stripe_account_id) {
      throw new HttpError("Teacher has no Stripe account", 400);
    }

    const fees = await getFees();
    // Mirror cash penalty: transactionFee% of per-credit pass value × spots redeemed
    const perCreditPrice = Math.ceil(b.price / b.sessions);
    const penaltyAmount = Math.round(
      b.spots * perCreditPrice * (fees.transactionFee / 100),
    );

    if (penaltyAmount <= 0) return job;

    const charge = await stripe.charges.create({
      amount: penaltyAmount,
      currency: b.currency.toLowerCase(),
      source: b.to_stripe_account_id,
      description: `Pass cancellation penalty for booking ${b.id}`,
      metadata: {
        kind: "pass_penalty",
        booking_id: b.id,
      },
    });

    await tx`
      UPDATE public.bookings
      SET stripe_penalty_charge_id = ${charge.id}
      WHERE id = ${b.id}
    `;

    return job;
  });
}

Deno.serve(async (req) => {
  try {
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

    const completedJobs: Job[] = [];
    const failedJobs: FailedJob[] = [];

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

    if (completedJobs.length) {
      const jobIds = completedJobs.map((j) => j.jobId);
      await sql`SELECT util.batch_dequeue('penalty_jobs', ${jobIds})`;
    }

    return jsonResponse({
      completed: completedJobs.length,
      failed: failedJobs.length,
      details: { completedJobs, failedJobs },
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Penalty Processing Error", error);
    return jsonResponse({ error: message }, status);
  }
});
