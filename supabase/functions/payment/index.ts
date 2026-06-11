import postgres from "postgres";
import Stripe from "stripe";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { exchange, getFees } from "../_shared/fees.ts";
import { jsonResponse } from "../_shared/response.ts";
import { analyzePaymentIntent } from "../_shared/stripe.ts";

// --- Configuration ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// --- Schemas ---
const requestSchema = z.object({
  projectId: z.uuidv7(),
  spots: z.number().positive().default(1),
});

// --- Core Logic ---
type TxResult =
  | { alreadyPaid: true }
  | {
      alreadyPaid: false;
      bookingId: string;
      priorPiId: string | null;
      priorSpots: number;
      project: {
        id: string;
        price: number;
        currency: string;
        end_at: string | null;
      };
      toStripeAccountId: string;
    };

// --- Handler ---
Deno.serve(async (req) => {
  try {
    // Guard Clauses
    if (req.method !== "POST") {
      throw new HttpError("Method Not Allowed", 405);
    }

    const { supabase, user } = await authenticateRequest(req);

    const body = await req.json();
    const { projectId, spots } = requestSchema.parse(body);

    const { data: customer } = await supabase
      .from("profiles")
      .select("id, stripe_account_id")
      .eq("id", user.id)
      .single()
      .throwOnError();

    if (!customer?.stripe_account_id)
      throw new HttpError("You cannot make payments yet", 406);

    // Transactional capacity check + Created-row reservation.
    //
    // The project row is locked FOR UPDATE so concurrent buyers serialize on
    // the capacity recalculation. Created rows count as inventory holds —
    // abandoned checkouts are swept by the reconciliation cron once their
    // Stripe PI lands in a terminal status.
    const txResult: TxResult = await sql.begin(async (tx) => {
      const [project] = await tx`
        SELECT p.id, p.price, p.currency, p.spots, p.end_at,
               prof.stripe_account_id AS teacher_stripe_account_id
        FROM public.projects p
        LEFT JOIN public.profiles prof ON prof.id = p.user_id
        WHERE p.id = ${projectId}
        FOR UPDATE OF p
      `;
      if (!project) throw new HttpError("Class not found", 404);
      if (!project.teacher_stripe_account_id)
        throw new HttpError("Teacher cannot receive payments yet", 406);
      if (!project.price || project.price <= 0)
        throw new HttpError("Class price is invalid", 406);
      if (project.end_at && new Date(project.end_at) < new Date())
        throw new HttpError("This class has already ended", 406);

      const [existingBooking] = await tx`
        SELECT id, spots, status, stripe_payment_intent_id
        FROM public.bookings
        WHERE user_id = ${user.id} AND project_id = ${projectId}
        FOR UPDATE
      `;

      if (
        existingBooking &&
        ["Succeeded", "CheckedIn", "Transferred"].includes(
          existingBooking.status,
        )
      ) {
        return { alreadyPaid: true };
      }

      // Exclude this user's own existing row from the occupancy count — we're
      // replacing it, not stacking onto it. `IS DISTINCT FROM` handles the
      // no-prior-row case (NULL) without filtering anyone out.
      const [{ occupied }] = await tx`
        SELECT COALESCE(SUM(spots), 0)::int AS occupied
        FROM public.bookings
        WHERE project_id = ${projectId}
          AND status IN ('Created', 'Succeeded', 'CheckedIn', 'Transferred')
          AND id IS DISTINCT FROM ${existingBooking?.id ?? null}
      `;
      const remainingSpots = project.spots - occupied;
      if (spots > remainingSpots) {
        throw new HttpError(
          remainingSpots > 0
            ? `Only ${remainingSpots} spots left`
            : "Class is already full",
          406,
        );
      }

      // Reserve the spot: insert (or revive a dead/Created row) with PI id NULL.
      // The PI id is filled in after Stripe call (outside the tx). The WHERE
      // on the conflict path allows retries (Created) and dead rows
      // (Canceled/Refunded/Failed), but rejects active rows (Refunding) which
      // weren't caught by the alreadyPaid short-circuit.
      const [booking] = await tx`
        INSERT INTO public.bookings (
          user_id, project_id, spots, status, price, currency,
          to_stripe_account_id, project_end_at,
          stripe_payment_intent_id, pass_purchase_id
        ) VALUES (
          ${user.id}, ${projectId}, ${spots}, 'Created',
          ${project.price}, ${project.currency},
          ${project.teacher_stripe_account_id}, ${project.end_at},
          NULL, NULL
        )
        ON CONFLICT (user_id, project_id) DO UPDATE
        SET spots = EXCLUDED.spots,
            status = 'Created',
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            to_stripe_account_id = EXCLUDED.to_stripe_account_id,
            project_end_at = EXCLUDED.project_end_at,
            -- Keep the prior PI id on Created→Created retries so the
            -- idempotency-key chain (plan #02) and the retry-retrieve flow
            -- (plan #03) both keep working. NULL it on dead-row resets —
            -- the old PI there is canceled/refunded/failed and unusable.
            stripe_payment_intent_id = CASE
              WHEN public.bookings.status = 'Created'
                THEN public.bookings.stripe_payment_intent_id
              ELSE NULL
            END,
            pass_purchase_id = NULL,
            refund_initiator = NULL
        WHERE public.bookings.status IN ('Created', 'Canceled', 'Refunded', 'Failed')
        RETURNING id
      `;
      if (!booking)
        throw new HttpError("You've already booked this class.", 409);

      // Only Created→Created retries can reuse the prior PI. For dead-row
      // resets (Canceled/Refunded/Failed) the old PI is unusable — Refunded
      // PIs stay in 'succeeded' status in Stripe (refunds are separate
      // objects), so reusing the id would re-bind a succeeded PI to the new
      // booking. Mirror the CASE in the upsert above.
      const reusablePriorPi = existingBooking?.status === "Created";
      return {
        alreadyPaid: false,
        bookingId: booking.id,
        priorPiId: reusablePriorPi
          ? (existingBooking.stripe_payment_intent_id ?? null)
          : null,
        priorSpots: existingBooking?.spots ?? spots,
        project: {
          id: project.id,
          price: project.price,
          currency: project.currency,
          end_at: project.end_at,
        },
        toStripeAccountId: project.teacher_stripe_account_id,
      };
    });

    if (txResult.alreadyPaid) {
      return jsonResponse({
        status: "succeeded",
        customerId: customer.stripe_account_id,
      });
    }

    const { bookingId, priorPiId, priorSpots, project, toStripeAccountId } =
      txResult;

    const fees = await getFees();
    const feePerSpot = exchange(
      fees.bookingFee,
      "USD",
      project.currency,
      fees.usdRates,
    );
    const total = project.price * spots + feePerSpot * spots;

    const session = await stripe.customerSessions.create({
      customer_account: customer.stripe_account_id,
      components: {
        mobile_payment_element: {
          enabled: true,
          features: {
            payment_method_save: "enabled",
            payment_method_redisplay: "enabled",
            payment_method_remove: "enabled",
          },
        },
      },
    });

    const piMetadata = {
      user_id: customer.id,
      project_id: project.id,
      spots,
      price: project.price,
      currency: project.currency,
      to_stripe_account_id: toStripeAccountId,
      end_at: project.end_at,
    };

    let intent: Stripe.PaymentIntent | null = null;

    if (priorPiId) {
      const existing = await stripe.paymentIntents.retrieve(priorPiId, {
        expand: ["latest_charge"],
      });
      const needsUpdate = priorSpots !== spots;
      const reconciliation = analyzePaymentIntent(existing, needsUpdate);

      console.log(
        `reconcilePaymentIntent: Action: ${reconciliation.action}. ${
          reconciliation.action === "RECREATE"
            ? `Reason: ${reconciliation.reason}`
            : `PI ${existing.id} status is ${existing.status}`
        }`,
      );

      switch (reconciliation.action) {
        case "REUSE":
          intent = reconciliation.intent;
          break;
        case "UPDATE":
          intent = await stripe.paymentIntents.update(
            reconciliation.intent.id,
            {
              amount: total,
              transfer_group: `booking_${project.id}_${user.id}`,
              metadata: piMetadata,
            },
          );
          break;
        case "RECREATE":
          intent = null;
          break;
      }
    }

    if (intent === null) {
      // Only key on priorPiId (canceled-PI rotation: retry must return the
      // same replacement PI). For brand-new or dead-row-rebook creates we
      // intentionally omit the key — a fixed `${total}:${currency}:${spots}`
      // fallback collides across cancel→rebook cycles for the same project,
      // making Stripe's 24h idempotency cache return the original succeeded
      // PI (shown as "Partial refund" in the dashboard) instead of a fresh
      // one. That stale PI then gets bound to the new booking row.
      const createOpts: Stripe.RequestOptions = priorPiId
        ? { idempotencyKey: `booking:${project.id}:${user.id}:${priorPiId}` }
        : {};
      intent = await stripe.paymentIntents.create(
        {
          amount: total,
          currency: project.currency.toLowerCase(),
          customer_account: customer.stripe_account_id,
          transfer_group: `booking_${project.id}_${user.id}`,
          automatic_payment_methods: { enabled: true },
          metadata: piMetadata,
        },
        createOpts,
      );
    }

    // Bind the held booking row to the PI. From here on the state machine
    // (util.apply_pi_status_booking) governs status transitions.
    await sql`
      UPDATE public.bookings
      SET stripe_payment_intent_id = ${intent.id}
      WHERE id = ${bookingId}
    `;

    return jsonResponse({
      customerId: customer.stripe_account_id,
      paymentIntentClientSecret: intent.client_secret,
      customerSessionClientSecret: session.client_secret,
      status: intent.status,
    });
  } catch (error) {
    const { message, status } = handleError("Payment Intent Error", error);
    return jsonResponse({ error: message }, status);
  }
});
