import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { type Fees, exchange, getFees } from "../_shared/fees.ts";
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
 * Processes a single refund job atomically.
 *
 * Uses Separate Charges and Transfers — the teacher transfer may or may not
 * exist at refund time (it only happens 48h after class ends + check-in).
 *
 * - student-initiated: student bears the Stripe fee.
 *   Amount = classPrice × spots × (1 - transactionFee%).
 *   If a transfer exists, it is reversed proportionally.
 *
 * - teacher-initiated: student gets a full refund.
 *   If a transfer exists, it is reversed and the teacher is compensated
 *   with the booking fee. Teacher effectively bears the Stripe processing
 *   fee on the class price.
 */
async function processJob(job: Job, fees: Fees) {
  const { bookingFee, transactionFee, usdRates } = fees;

  return await sql.begin(async () => {
    // 1. Fetch booking data — refund_initiator is set by the validate_refund_eligibility trigger
    const [booking] = await sql`
      SELECT b.id, b.stripe_payment_intent_id, b.spots, b.refund_initiator,
             b.stripe_transfer_id, p.price, p.currency,
             pr.stripe_account_id AS teacher_stripe_account_id
      FROM public.bookings b
      JOIN public.projects p ON p.id = b.project_id
      JOIN public.profiles pr ON pr.id = p.user_id
      WHERE b.id = ${job.id} AND b.status = 'Refunding'
      FOR UPDATE
    `;

    if (!booking) {
      throw new HttpError(
        `Booking ${job.id} not found or not in Refunding status`,
        404,
      );
    }

    if (!booking.stripe_payment_intent_id) {
      throw new HttpError(`Booking ${job.id} has no payment intent`, 400);
    }

    if (!booking.refund_initiator) {
      throw new HttpError(`Booking ${job.id} has no refund initiator`, 400);
    }

    const hasTransfer = !!booking.stripe_transfer_id;
    const metadata = {
      jobId: job.jobId.toString(),
      bookingId: booking.id.toString(),
      initiator: booking.refund_initiator,
    };

    if (booking.refund_initiator === "Student") {
      const price = booking.spots * booking.price;
      const refundAmount = Math.round(price * (1 - transactionFee / 100));

      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmount,
        ...(hasTransfer && { reverse_transfer: true }),
        metadata,
      });

      return { ...job, refundId: refund.id, status: refund.status };
    } else {
      if (!booking.teacher_stripe_account_id) {
        throw new HttpError(
          `Booking ${job.id}: teacher has no Stripe account`,
          400,
        );
      }

      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        ...(hasTransfer && { reverse_transfer: true }),
        metadata,
      });

      // Compensate teacher with booking fee only if a transfer was reversed
      let stripeTransferId: string | undefined;
      if (hasTransfer) {
        const feePerSpot = exchange(
          bookingFee,
          "USD",
          booking.currency,
          usdRates,
        );
        const bookingFeeAmount = feePerSpot * booking.spots;

        const transfer = await stripe.transfers.create({
          amount: bookingFeeAmount,
          currency: booking.currency.toLowerCase(),
          destination: booking.teacher_stripe_account_id,
          metadata: {
            jobId: job.jobId.toString(),
            bookingId: booking.id.toString(),
            reason: "spot_fee_compensation",
          },
        });
        stripeTransferId = transfer.id;
      }

      return {
        ...job,
        refundId: refund.id,
        stripeTransferId,
        status: refund.status,
      };
    }
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

    const fees = await getFees();
    const completedJobs: Array<
      Job & {
        refundId: string;
        stripeTransferId?: string;
        status: string | null;
      }
    > = [];
    const failedJobs: FailedJob[] = [];

    // Process jobs sequentially (refunds should be handled carefully)
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
