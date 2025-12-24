// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { z } from "npm:zod";

// We'll make a direct Postgres connection to update the document
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

// Initialize Postgres client
const sql = postgres(
  // `SUPABASE_DB_URL` is a built-in environment variable
  Deno.env.get("SUPABASE_DB_URL")!
);

const jobSchema = z.object({
  jobId: z.number(),
  id: z.string(),
});

const failedJobSchema = jobSchema.extend({
  error: z.string(),
});

type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

type Row = {
  id: string;
  preview_url: string;
};

const QUEUE_NAME = "embedding_jobs";

// Listen for HTTP requests
Deno.serve(async (req) => {
  if (
    req.headers.get("X-Internal-Secret-Key") !==
    Deno.env.get("INTERNAL_SECRET_KEY")
  ) {
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("expected POST request", { status: 405 });
  }

  if (req.headers.get("Content-Type") !== "application/json") {
    return new Response("expected JSON body", { status: 400 });
  }

  // Use Zod to parse and validate the request body
  const parseResult = z.array(jobSchema).safeParse(await req.json());

  if (parseResult.error) {
    return new Response(`invalid request body: ${parseResult.error.message}`, {
      status: 400,
    });
  }

  const pendingJobs = parseResult.data;

  // Track jobs that completed successfully
  const completedJobs: Job[] = [];

  // Track jobs that failed due to an error
  const failedJobs: FailedJob[] = [];

  async function processJobs() {
    let currentJob: Job | undefined;

    while ((currentJob = pendingJobs.shift()) !== undefined) {
      try {
        await processJob(currentJob);
        completedJobs.push(currentJob);
      } catch (error) {
        failedJobs.push({
          ...currentJob,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }
  }

  try {
    // Process jobs while listening for worker termination
    await Promise.race([processJobs(), catchUnload()]);
  } catch (error) {
    // If the worker is terminating (e.g. wall clock limit reached),
    // add pending jobs to fail list with termination reason
    failedJobs.push(
      ...pendingJobs.map((job) => ({
        ...job,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }))
    );
  }

  // Log completed and failed jobs for traceability
  console.log("finished processing jobs:", {
    completedJobs: completedJobs.length,
    failedJobs: failedJobs.length,
  });

  return new Response(
    JSON.stringify({
      completedJobs,
      failedJobs,
    }),
    {
      // 200 OK response
      status: 200,

      // Custom headers to report job status
      headers: {
        "Content-Type": "application/json",
        "X-Completed-Jobs": completedJobs.length.toString(),
        "X-Failed-Jobs": failedJobs.length.toString(),
      },
    }
  );
});

/**
 * Generates an embedding for the given text.
 */
async function generateEmbedding(url: string) {
  // simulate async embedding generation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // dummy random vector of size 2, each rounded to 2 decimals
  const n1 = Math.random() * 2 - 1;
  const n2 = Math.random() * 2 - 1;
  return [Number(n1.toFixed(2)), Number(n2.toFixed(2))];
}

/**
 * Processes an embedding job.
 */
async function processJob(job: Job) {
  const { jobId, id } = job;

  // Fetch song data from the public.songs
  const [row]: [Row] = await sql`
    select
      id,
      preview_url
    from
      public.songs
    where
      id = ${id}
  `;

  if (!row) {
    throw new Error(`row not found: public.songs/${id}`);
  }

  // Generate embedding from the song url
  const embedding = await generateEmbedding(row.preview_url);

  // Find nearest cluster centroid
  const [result] = await sql`
    select util.find_nearest_centroid(${JSON.stringify(
      embedding
    )}) as centroid_id
  `;
  const centroidId = result.centroid_id ? Number(result.centroid_id) : null;

  // Update the song row with the embedding and nearest centroid
  await sql`
    update
      public.songs
    set
      embedding = ${JSON.stringify(embedding)},
      centroid_id = ${centroidId}
    where
      id = ${id}
  `;

  // Dequeue the job
  await sql`
    select util.dequeue_embeddings(${QUEUE_NAME}, ${jobId}::bigint)
  `;
}

/**
 * Returns a promise that rejects if the worker is terminating.
 */
function catchUnload() {
  return new Promise((reject) => {
    addEventListener("beforeunload", (ev: any) => {
      reject(new Error(ev.detail?.reason));
    });
  });
}
