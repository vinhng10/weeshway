import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { getFees } from "../_shared/fees.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const jobSchema = z.object({
  jobId: z.number(),
  id: z.uuid(),
});
const failedJobSchema = jobSchema.extend({ error: z.string() });
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

async function processJob(job: Job): Promise<Job> {
  return await sql.begin(async (tx) => {
    const [pp] = await tx`
      SELECT pp.id, pp.remaining_sessions, pp.sessions, pp.price, pp.currency,
             pp.stripe_charge_id, pp.stripe_expiry_transfer_id,
             prof.stripe_account_id AS teacher_account_id
      FROM public.pass_purchases pp
      LEFT JOIN public.passes p ON p.id = pp.pass_id
      LEFT JOIN public.profiles prof ON prof.id = p.user_id
      WHERE pp.id = ${job.id}
      FOR UPDATE OF pp
    `;

    if (!pp) throw new Error("pass_purchase not found");
    if (pp.stripe_expiry_transfer_id) return job; // already transferred — idempotent skip
    if (pp.remaining_sessions <= 0) return job; // nothing to sweep

    const fees = await getFees();
    const perCreditNet = Math.ceil(
      (pp.price * (1 - fees.transactionFee / 100)) / pp.sessions,
    );
    const amount = pp.remaining_sessions * perCreditNet;

    const transfer = await stripe.transfers.create({
      amount,
      currency: pp.currency.toLowerCase(),
      destination: pp.teacher_account_id,
      source_transaction: pp.stripe_charge_id,
      metadata: {
        kind: "pass_expiry",
        pass_purchase_id: pp.id,
      },
    });

    await tx`
      UPDATE public.pass_purchases
      SET stripe_expiry_transfer_id = ${transfer.id}
      WHERE id = ${pp.id}
    `;

    return job;
  });
}

Deno.serve(async (req) => {
  try {
    authenticateInternalRequest(req);

    if (req.method !== "POST") {
      throw new Error("Method Not Allowed");
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
      await sql`SELECT util.batch_dequeue('pass_expiry_jobs', ${jobIds})`;
    }

    return jsonResponse({
      completed: completedJobs.length,
      failed: failedJobs.length,
      details: { completedJobs, failedJobs },
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Pass Expire Error", error);
    return jsonResponse({ error: message }, status);
  }
});
