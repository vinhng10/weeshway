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
  pass_purchase_id: z.uuid(),
  kind: z.enum(["cooling-off", "teacher-deletion"]),
});
const failedJobSchema = jobSchema.extend({ error: z.string() });
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

async function processJob(job: Job): Promise<Job> {
  return await sql.begin(async (tx) => {
    const [pp] = await tx`
      SELECT id, sessions, remaining_sessions, price, booking_fee,
             currency, stripe_payment_intent_id, status
      FROM public.pass_purchases
      WHERE id = ${job.pass_purchase_id}
      FOR UPDATE
    `;

    if (!pp) throw new Error("pass_purchase not found");
    if (pp.status === "Refunded") return job; // already refunded — idempotent skip

    let amount: number;
    if (job.kind === "cooling-off") {
      if (pp.remaining_sessions < pp.sessions)
        throw new Error("Cooling-off invariant violated: credits used.");
      const fees = await getFees();
      amount = Math.floor(pp.price * (1 - fees.transactionFee / 100));
    } else {
      // teacher-deletion: refund remaining credits at gross price + their booking fees
      const perCreditGross = Math.ceil(pp.price / pp.sessions);
      const perCreditBooking = pp.booking_fee / pp.sessions; // exact: booking_fee = rate × sessions
      amount = pp.remaining_sessions * (perCreditGross + perCreditBooking);
    }

    await stripe.refunds.create({
      payment_intent: pp.stripe_payment_intent_id,
      amount,
      reason: "requested_by_customer",
      metadata: {
        kind: "pass",
        pass_purchase_id: pp.id,
        refund_kind: job.kind,
      },
    });

    // Status flip to 'Refunded' is handled by the charge.refunded webhook
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

    return jsonResponse({
      completed: completedJobs.length,
      failed: failedJobs.length,
      details: { completedJobs, failedJobs },
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Pass Refund Error", error);
    return jsonResponse({ error: message }, status);
  }
});
