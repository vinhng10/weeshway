import postgres from "postgres";
import { z } from "zod";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- 1. Configuration & Clients ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET_KEY");
const QUEUE_NAME = "embedding_jobs";
const CONCURRENCY_LIMIT = 4;

const jobSchema = z.object({
  jobId: z.number(),
  id: z.string(),
});
const failedJobSchema = jobSchema.extend({
  error: z.string(),
});
type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

// --- 2. Core Logic Helpers ---
/**
 * Generates an embedding for a given URL.
 */
async function generateEmbedding(url: string): Promise<number[]> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 1000));
  return Array.from({ length: 2 }, () =>
    Number((Math.random() * 2 - 1).toFixed(2))
  );
}

/**
 * Atomic operation for a single job
 */
async function processJob(job: z.infer<typeof jobSchema>) {
  return await sql.begin(async () => {
    // 1. Fetch song data
    const [song] = await sql`
      SELECT id, preview_url FROM public.songs WHERE id = ${job.id} FOR UPDATE
    `;

    if (!song) throw new Error(`Song ${job.id} not found`);

    // 2. Generate embedding (External Call)
    const embedding = await generateEmbedding(song.preview_url);

    // 3. Find centroid & Update song in one go (if your SQL logic allows)
    // We can use a subquery or a CTE to minimize round trips
    await sql`
      WITH nearest AS (
        SELECT util.find_nearest_centroid(${JSON.stringify(embedding)}) as cid
      )
      UPDATE public.songs
      SET 
        embedding = ${JSON.stringify(embedding)},
        centroid_id = (SELECT cid FROM nearest)
      WHERE id = ${job.id}
    `;

    // 4. Cleanup queue
    await sql`SELECT util.dequeue_embeddings(${QUEUE_NAME}, ${job.jobId})`;

    return job;
  });
}

// --- 3. Main Handler ---
Deno.serve(async (req) => {
  // Guard Clauses
  if (req.headers.get("X-Internal-Secret-Key") !== INTERNAL_SECRET) {
    return new Response("Unauthorized", { status: 403 });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const rawBody = await req.json().catch(() => []);
    const result = z.array(jobSchema).safeParse(rawBody);

    if (!result.success) {
      return jsonResponse({ error: result.error.format() }, 400);
    }

    const pendingJobs = result.data;
    const completedJobs: Job[] = [];
    const failedJobs: FailedJob[] = [];

    const worker = async () => {
      let job: Job | undefined;
      while ((job = pendingJobs.shift()) !== undefined) {
        try {
          await processJob(job);
          completedJobs.push(job);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          failedJobs.push({ ...job, error: message });
        }
      }
    };

    // Run workers in parallel
    await Promise.race([
      Promise.all(Array(CONCURRENCY_LIMIT).fill(null).map(worker)),
      new Promise((_, reject) => {
        addEventListener("beforeunload", () =>
          reject(new Error("Worker terminating"))
        );
      }),
    ]).catch(() => {
      // Catch remaining jobs if termination occurs
      pendingJobs.forEach((j: Job) =>
        failedJobs.push({ ...j, error: "Termination" })
      );
    });

    return jsonResponse(
      {
        completed: completedJobs.length,
        failed: failedJobs.length,
        details: { completedJobs, failedJobs },
      },
      200,
      {
        "X-Completed-Jobs": completedJobs.length.toString(),
        "X-Failed-Jobs": failedJobs.length.toString(),
      }
    );
  } catch (err: unknown) {
    const { message, status } = handleError("Embedding Processing Error", err);
    return jsonResponse({ error: message }, status);
  }
});
