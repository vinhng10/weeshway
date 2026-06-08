import postgres from "postgres";
import { z } from "zod";
import { authenticateInternalRequest } from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { sendPush } from "../_shared/push.ts";
import { jsonResponse } from "../_shared/response.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);

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

    // 1. Create a lookup to link internal IDs to Job IDs
    const jobIdLookup = new Map(
      jobs.map((j) => [String(j.id), String(j.jobId)]),
    );

    // 2. Fetch targets
    const targets = await sql`
      SELECT 
        ri.id, 
        ri.wish_id, 
        ri.project_id, 
        w.user_id, 
        p.expo_push_token, 
        s.name as song_name
      FROM recommendation_items ri
      JOIN wishes w ON ri.wish_id = w.id
      JOIN profiles p ON w.user_id = p.id
      LEFT JOIN songs s ON w.song_id = s.id
      WHERE ri.id = ANY(${jobs.map((j) => j.id)}) AND p.expo_push_token IS NOT NULL
    `;

    // 3. Group by user_id and pick one random target per user
    const groups = Map.groupBy(targets, (t) => t.user_id);
    const pickedTargets = Array.from(groups.values()).map(
      (group) => group[Math.floor(Math.random() * group.length)],
    );

    // 4. Map picked targets to Expo messages and collect Job IDs for dequeuing
    const successfulJobIds: string[] = [];
    const toSend = pickedTargets.map((target) => {
      successfulJobIds.push(jobIdLookup.get(target.id)!);

      return {
        to: target.expo_push_token,
        sound: "default",
        title: `You like ${target.song_name}?`,
        body: "This class feels like your vibe 🔥",
        data: { wishId: target.wish_id, projectId: target.project_id },
      };
    });

    if (!toSend.length) return jsonResponse({ sent: 0, skipped: jobs.length });

    // 5. Dispatch to Expo
    await sendPush(toSend);

    // 6. Dequeue only the jobs we actually sent
    await sql`SELECT util.batch_dequeue('notification_jobs', ${successfulJobIds})`;

    return jsonResponse({
      sent: toSend.length,
      dequeued: successfulJobIds.length,
    });
  } catch (error) {
    const { message, status } = handleError("Push Error", error);
    return jsonResponse({ error: message }, status);
  }
});
