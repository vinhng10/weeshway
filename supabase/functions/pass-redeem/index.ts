import postgres from "postgres";
import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);

const bodySchema = z.object({
  passPurchaseId: z.uuid(),
  projectId: z.uuid(),
  spots: z.number().int().positive(),
});

Deno.serve(async (req) => {
  try {
    const { user } = await authenticateRequest(req);
    const body = await req.json();
    const { passPurchaseId, projectId, spots } = bodySchema.parse(body);
    const userId = user.id;

    const bookingId = await sql.begin(async (tx) => {
      // Lock project first (matches cash payment lock order)
      const [project] = await tx`
        SELECT id, user_id AS teacher_id, spots, end_at, currency, price
        FROM public.projects
        WHERE id = ${projectId}
        FOR UPDATE
      `;
      if (!project) throw new HttpError("Project not found.", 404);

      // Derive remaining capacity from active bookings inside the tx
      const [{ occupied }] = await tx`
        SELECT COALESCE(SUM(spots), 0)::int AS occupied
        FROM public.bookings
        WHERE project_id = ${projectId}
          AND status IN ('Succeeded', 'CheckedIn', 'Transferred')
      `;
      const remainingSpots = project.spots - occupied;

      // Lock pass_purchase; join passes + profiles to get teacher identity
      const [pp] = await tx`
        SELECT pp.id, pp.remaining_sessions, pp.expires_at, pp.status,
               p.user_id AS pass_teacher_id,
               prof.stripe_account_id AS teacher_stripe_account_id
        FROM public.pass_purchases pp
        LEFT JOIN public.passes p ON p.id = pp.pass_id
        LEFT JOIN public.profiles prof ON prof.id = p.user_id
        WHERE pp.id = ${passPurchaseId} AND pp.user_id = ${userId}
        FOR UPDATE OF pp
      `;
      if (!pp) throw new HttpError("Pass not found.", 404);

      if (pp.status !== "Succeeded")
        throw new HttpError("This pass is not redeemable.", 400);
      if (pp.remaining_sessions < spots)
        throw new HttpError(
          `This pass only has ${pp.remaining_sessions} sessions left.`,
          400,
        );
      if (pp.expires_at && new Date(pp.expires_at) <= new Date())
        throw new HttpError("This pass has expired.", 400);
      if (pp.pass_teacher_id !== project.teacher_id)
        throw new HttpError("This pass is not valid for this teacher.", 400);
      if (remainingSpots < spots)
        throw new HttpError(
          remainingSpots > 0
            ? `Only ${remainingSpots} spots left`
            : "Class is already full",
          400,
        );

      // price = project class price (informational; transfer worker derives per-credit net from pass)
      // ON CONFLICT path lets the pass take over any non-active row — including a 'Created'
      // cash booking from an abandoned Stripe flow. Only confirmed/in-flight bookings block
      // the takeover; empty RETURNING then signals a genuine duplicate.
      const [booking] = await tx`
        INSERT INTO public.bookings (
          user_id, project_id, pass_purchase_id, spots, status,
          price, currency, project_end_at, to_stripe_account_id
        ) VALUES (
          ${userId}, ${projectId}, ${passPurchaseId}, ${spots}, 'Succeeded',
          ${project.price}, ${project.currency}, ${project.end_at},
          ${pp.teacher_stripe_account_id}
        )
        ON CONFLICT (user_id, project_id) DO UPDATE
        SET pass_purchase_id = EXCLUDED.pass_purchase_id,
            spots = EXCLUDED.spots,
            status = EXCLUDED.status,
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            project_end_at = EXCLUDED.project_end_at,
            to_stripe_account_id = EXCLUDED.to_stripe_account_id,
            refund_initiator = NULL,
            stripe_payment_intent_id = NULL,
            stripe_transfer_id = NULL,
            stripe_penalty_charge_id = NULL,
            checked_in_at = NULL
        WHERE public.bookings.status NOT IN ('Succeeded', 'CheckedIn', 'Transferred', 'Refunding')
        RETURNING id
      `;
      if (!booking)
        throw new HttpError("You've already booked this class.", 409);

      await tx`
        UPDATE public.pass_purchases
        SET remaining_sessions = remaining_sessions - ${spots},
            status = CASE
              WHEN remaining_sessions - ${spots} = 0 THEN 'Used'::public.pass_status
              ELSE status
            END
        WHERE id = ${passPurchaseId}
      `;

      return booking.id;
    });

    return jsonResponse({ bookingId });
  } catch (error: unknown) {
    const { message, status } = handleError("Pass Redeem Error", error);
    return jsonResponse({ error: message }, status);
  }
});
