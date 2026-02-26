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
  id: z.number(),
});
const failedJobSchema = jobSchema.extend({
  error: z.string(),
});
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

async function processJob(job: Job, transactionFee: number) {
  return await sql.begin(async () => {
    // 1. Fetch booking with check-in and no transfer yet
    const [booking] = await sql`
      SELECT b.id, b.stripe_payment_intent_id, b.spots, b.user_id,
             p.price, p.currency, p.id AS project_id,
             pr.stripe_account_id AS teacher_stripe_account_id
      FROM public.bookings b
      JOIN public.projects p ON p.id = b.project_id
      JOIN public.profiles pr ON pr.id = p.user_id
      WHERE b.id = ${job.id}
        AND b.status = 'Transferred'
        AND b.stripe_transfer_id IS NULL
      FOR UPDATE
    `;

    if (!booking) {
      throw new HttpError(
        `Booking ${job.id} not found or not eligible for transfer`,
        404,
      );
    }

    if (!booking.teacher_stripe_account_id) {
      throw new HttpError(
        `Booking ${job.id}: teacher has no Stripe account`,
        400,
      );
    }

    // 2. Retrieve the original charge from the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.stripe_payment_intent_id,
    );

    if (!paymentIntent.latest_charge) {
      throw new HttpError(
        `Booking ${job.id}: no charge found on payment intent`,
        400,
      );
    }

    const chargeId = paymentIntent.latest_charge as string;

    // 3. Calculate teacher amount: classPrice * spots * (1 - transactionFee/100)
    const classPrice = booking.price * booking.spots;
    const transferAmount = Math.round(classPrice * (1 - transactionFee / 100));

    // 4. Create Stripe Transfer
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: booking.currency.toLowerCase(),
      destination: booking.teacher_stripe_account_id,
      source_transaction: chargeId,
      transfer_group: `booking_${booking.project_id}_${booking.user_id}`,
      metadata: {
        jobId: job.jobId.toString(),
        bookingId: booking.id.toString(),
      },
    });

    // 5. Update booking with stripe_transfer_id
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

    const { transactionFee } = await getFees();
    const completedJobs: Array<Job & { stripeTransferId: string }> = [];
    const failedJobs: FailedJob[] = [];

    for (const job of pendingJobs) {
      try {
        const result = await processJob(job, transactionFee);
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
