import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { type Fees, getFees } from "../_shared/fees.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const jobSchema = z.object({
  jobId: z.number(),
  id: z.uuidv7(),
});
const failedJobSchema = jobSchema.extend({
  error: z.string(),
});
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

async function processJob(job: Job, fees: Fees) {
  return await sql.begin(async () => {
    // 1. Fetch booking with no transfer yet
    const [booking] = await sql`
      SELECT * FROM public.bookings
      WHERE id = ${job.id}
        AND status = 'Transferred'
        AND stripe_transfer_id IS NULL
      FOR UPDATE
    `;

    if (!booking) {
      throw new HttpError(
        `Booking ${job.id} not found or not eligible for transfer`,
        404,
      );
    }

    if (!booking.to_stripe_account_id) {
      throw new HttpError(
        `Booking ${job.id}: teacher has no Stripe account`,
        400,
      );
    }

    // 2. Determine source charge and transfer amount
    let transferAmount: number;
    let chargeId: string;

    if (booking.pass_purchase_id) {
      const [pp] = await sql`
        SELECT stripe_charge_id, price, sessions
        FROM public.pass_purchases
        WHERE id = ${booking.pass_purchase_id}
      `;
      if (!pp)
        throw new HttpError(
          `Booking ${job.id}: pass_purchases row missing`,
          400,
        );
      const perCreditNet = Math.ceil(
        (pp.price * (1 - fees.transactionFee / 100)) / pp.sessions,
      );
      transferAmount = booking.spots * perCreditNet;
      chargeId = pp.stripe_charge_id;
    } else {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.stripe_payment_intent_id,
      );
      if (!paymentIntent.latest_charge) {
        throw new HttpError(
          `Booking ${job.id}: no charge found on payment intent`,
          400,
        );
      }
      chargeId = paymentIntent.latest_charge as string;
      transferAmount = Math.round(
        booking.price * booking.spots * (1 - fees.transactionFee / 100),
      );
    }

    const currency = booking.currency.toLowerCase();

    // 3. Create Stripe Transfer to teacher
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency,
      destination: booking.to_stripe_account_id,
      source_transaction: chargeId,
      metadata: {
        jobId: job.jobId.toString(),
        bookingId: booking.id.toString(),
        ...(booking.pass_purchase_id
          ? { passPurchaseId: booking.pass_purchase_id }
          : {}),
      },
    });

    // 4. Update booking with stripe_transfer_id
    await sql`
      UPDATE public.bookings
      SET stripe_transfer_id = ${transfer.id}
      WHERE id = ${booking.id}
    `;

    return { ...job, stripeTransferId: transfer.id };
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

    const fees = await getFees();
    const completedJobs: Array<Job & { stripeTransferId: string }> = [];
    const failedJobs: FailedJob[] = [];

    for (const job of pendingJobs) {
      try {
        const result = await processJob(job, fees);
        completedJobs.push(result);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        failedJobs.push({ ...job, error: message });
      }
    }

    // Dequeue successful jobs
    if (completedJobs.length) {
      const jobIds = completedJobs.map((j) => j.jobId);
      await sql`SELECT util.batch_dequeue('transfer_jobs', ${jobIds})`;
    }

    return jsonResponse({
      completed: completedJobs.length,
      failed: failedJobs.length,
      details: { completedJobs, failedJobs },
    });
  } catch (error: unknown) {
    const { message, status } = handleError("Transfer Processing Error", error);
    return jsonResponse({ error: message }, status);
  }
});
