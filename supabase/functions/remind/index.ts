import postgres from "postgres";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");

const jobSchema = z.array(
  z.object({
    jobId: z.number(),
    id: z.uuidv7(),
  }),
);

Deno.serve(async (req) => {
  try {
    authenticateInternalRequest(req);

    if (req.method !== "POST") {
      throw new HttpError("Method Not Allowed", 405);
    }

    const jobs = jobSchema.parse(await req.json());
    if (!jobs.length) return jsonResponse({ sent: 0 });

    const projectIds = jobs.map((j) => j.id);

    // Fetch all booked users with push tokens for these projects
    const targets = await sql`
      SELECT
        b.project_id,
        p.expo_push_token,
        s.name AS song_name,
        pr.start_at
      FROM public.bookings b
      JOIN public.profiles p ON b.user_id = p.id
      JOIN public.projects pr ON b.project_id = pr.id
      LEFT JOIN public.songs s ON pr.song_id = s.id
      WHERE b.project_id = ANY(${projectIds})
        AND b.status IN ('Succeeded', 'CheckedIn')
        AND p.expo_push_token IS NOT NULL
    `;

    if (!targets.length) {
      const jobIds = jobs.map((j) => j.jobId);
      await sql`SELECT util.batch_dequeue('reminder_jobs', ${jobIds})`;
      return jsonResponse({ sent: 0, skipped: jobs.length });
    }

    // Build push messages for every booker
    const messages = targets.map((t) => ({
      to: t.expo_push_token,
      sound: "default",
      title: "Class starting soon!",
      body: `${t.song_name ?? "Your class"} starts in less than 1 hour`,
      data: { projectId: t.project_id },
    }));

    // Dispatch to Expo Push API
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) throw new HttpError("Expo service failure", 502);

    // Dequeue all processed jobs
    const jobIds = jobs.map((j) => j.jobId);
    await sql`SELECT util.batch_dequeue('reminder_jobs', ${jobIds})`;

    return jsonResponse({ sent: messages.length, dequeued: jobIds.length });
  } catch (error) {
    const { message, status } = handleError("Remind Error", error);
    return jsonResponse({ error: message }, status);
  }
});
