import Faad2ModuleFactory from "faad2-wasm";
import * as ort from "https://esm.sh/onnxruntime-web@1.18.0";
import postgres from "postgres";
import { z } from "zod";
import {
  authenticateInternalRequest,
  createServiceRoleClient,
} from "../_shared/auth.ts";
import { handleError, HttpError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- Configuration ---
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const CONCURRENCY_LIMIT = 1;
const TARGET_SR = 16000;
const TARGET_SAMPLES = TARGET_SR * 15; // 15s = 240,000 samples

ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
ort.env.wasm.numThreads = 1;

// FAAD2's packed return uses this index (1-based) for sample rate
const FAAD2_SAMPLE_RATES = [
  0, 8000, 16000, 22050, 32000, 44100, 48000, 64000, 88200, 96000,
];

// AAC frequency index → sample rate (ISO 14496-3 Table 1.18)
const AAC_FREQ_TABLE = [
  96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025,
  8000, 7350,
];
const AAC_FRAME_SAMPLES = 1024; // AAC-LC samples per frame

const CONTAINER_BOXES = new Set(["moov", "trak", "mdia", "minf", "stbl"]);

// --- Lazy singletons (cached across requests within the same isolate) ---

function lazy<T>(init: () => Promise<T>): () => Promise<T> {
  let p: Promise<T> | null = null;
  return () => (p ??= init());
}

const getFaad2Module = lazy(async () => {
  const resp = await fetch(
    "https://unpkg.com/@ohrstrom/faad2-wasm@2.11.2-rc.4/faad2_wasm.wasm",
  );
  if (!resp.ok) throw new HttpError("Failed to fetch FAAD2 WASM", 502);
  return Faad2ModuleFactory({
    wasmBinary: new Uint8Array(await resp.arrayBuffer()),
  });
});

const getOnnxSession = lazy(async () => {
  const { data, error } = await createServiceRoleClient()
    .storage.from("models")
    .download("song2vec_embedding.onnx");
  if (error || !data)
    throw new HttpError(
      `Failed to download ONNX model: ${error?.message}`,
      502,
    );
  const buf = new Uint8Array(await data.arrayBuffer());
  return ort.InferenceSession.create(buf, {
    executionProviders: ["wasm"],
  });
});

// --- Audio helpers ---

/** Extract sample rate from AudioSpecificConfig (ISO 14496-3 §1.6.2.1) */
function sampleRateFromASC(asc: Uint8Array): number {
  // Layout: audioObjectType(5 bits) + frequencyIndex(4 bits) + ...
  const freqIndex = ((asc[0] & 0x07) << 1) | (asc[1] >> 7);
  if (freqIndex === 0x0f) {
    // Explicit 24-bit sample rate follows
    return (
      ((asc[1] & 0x7f) << 17) | (asc[2] << 9) | (asc[3] << 1) | (asc[4] >> 7)
    );
  }
  return AAC_FREQ_TABLE[freqIndex] ?? 44100;
}

/**
 * Select only the frames covering the middle ~15s of audio.
 * Returns a slice of the frame list, avoiding decoding the entire file.
 */
function selectMiddleFrames(
  frames: { offset: number; size: number }[],
  ascSampleRate: number,
): { offset: number; size: number }[] {
  const neededFrames = Math.ceil((15 * ascSampleRate) / AAC_FRAME_SAMPLES);
  const margin = 4; // extra frames for AAC decoder priming
  const total = frames.length;

  if (total <= neededFrames + margin * 2) return frames;

  const start = Math.max(0, Math.floor((total - neededFrames) / 2) - margin);
  const end = Math.min(total, start + neededFrames + margin * 2);
  return frames.slice(start, end);
}

// --- Minimal MP4/M4A parser ---

function boxType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
}

interface Mp4ParseResult {
  asc: Uint8Array;
  frames: { offset: number; size: number }[];
}

function parseMp4(buffer: ArrayBuffer): Mp4ParseResult {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let asc: Uint8Array | null = null;
  const sampleSizes: number[] = [];
  const chunkOffsets: number[] = [];
  const samplesToChunks: { firstChunk: number; samplesPerChunk: number }[] = [];

  function readBoxHeader(offset: number) {
    let size = view.getUint32(offset);
    const type = boxType(bytes, offset + 4);
    let headerSize = 8;
    if (size === 1) {
      size = Number(view.getBigUint64(offset + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = buffer.byteLength - offset;
    }
    return { size, type, headerSize };
  }

  // Extract AudioSpecificConfig from esds descriptor chain
  function extractASC(data: Uint8Array): Uint8Array | null {
    let i = 0;
    function readDesc() {
      if (i >= data.length) return { tag: 0, start: i, end: i };
      const tag = data[i++];
      let size = 0;
      for (let j = 0; j < 4 && i < data.length; j++) {
        const b = data[i++];
        size = (size << 7) | (b & 0x7f);
        if (!(b & 0x80)) break;
      }
      return { tag, start: i, end: i + size };
    }
    const esDesc = readDesc(); // ES_Descriptor (tag 3)
    if (esDesc.tag !== 3) return null;
    i = esDesc.start + 3; // skip ES_ID(2) + flags(1)
    const decConfig = readDesc(); // DecoderConfigDescriptor (tag 4)
    if (decConfig.tag !== 4) return null;
    i = decConfig.start + 13; // skip fixed fields
    const decSpecific = readDesc(); // DecoderSpecificInfo (tag 5) — the ASC
    if (decSpecific.tag !== 5) return null;
    return data.slice(decSpecific.start, decSpecific.end);
  }

  function walkBoxes(start: number, end: number) {
    let offset = start;
    while (offset + 8 <= end) {
      const { size, type, headerSize } = readBoxHeader(offset);
      if (size < 8) break;
      const boxEnd = Math.min(offset + size, end);
      const d = offset + headerSize; // data start

      if (CONTAINER_BOXES.has(type)) walkBoxes(d, boxEnd);

      switch (type) {
        case "stsd": {
          const count = view.getUint32(d + 4);
          let entryOff = d + 8;
          for (let e = 0; e < count && entryOff + 8 < boxEnd; e++) {
            const entrySize = view.getUint32(entryOff);
            if (boxType(bytes, entryOff + 4) === "mp4a") {
              let cOff = entryOff + 36; // skip mp4a fixed header
              while (cOff + 8 < entryOff + entrySize) {
                const cSize = view.getUint32(cOff);
                if (cSize < 8) break;
                if (boxType(bytes, cOff + 4) === "esds") {
                  asc = extractASC(bytes.slice(cOff + 12, cOff + cSize));
                }
                cOff += cSize;
              }
            }
            entryOff += entrySize;
          }
          break;
        }
        case "stsz": {
          const defaultSize = view.getUint32(d + 4);
          const count = view.getUint32(d + 8);
          if (defaultSize !== 0) {
            for (let i = 0; i < count; i++) sampleSizes.push(defaultSize);
          } else {
            for (let i = 0; i < count; i++)
              sampleSizes.push(view.getUint32(d + 12 + i * 4));
          }
          break;
        }
        case "stco": {
          const count = view.getUint32(d + 4);
          for (let i = 0; i < count; i++)
            chunkOffsets.push(view.getUint32(d + 8 + i * 4));
          break;
        }
        case "co64": {
          const count = view.getUint32(d + 4);
          for (let i = 0; i < count; i++)
            chunkOffsets.push(Number(view.getBigUint64(d + 8 + i * 8)));
          break;
        }
        case "stsc": {
          const count = view.getUint32(d + 4);
          for (let i = 0; i < count; i++) {
            const off = d + 8 + i * 12;
            samplesToChunks.push({
              firstChunk: view.getUint32(off),
              samplesPerChunk: view.getUint32(off + 4),
            });
          }
          break;
        }
      }
      offset = boxEnd;
    }
  }

  walkBoxes(0, buffer.byteLength);
  if (!asc)
    throw new HttpError("No AudioSpecificConfig found in M4A file", 400);

  // Build frame list from sample table
  const frames: Mp4ParseResult["frames"] = [];
  let sampleIdx = 0;

  for (let chunkIdx = 0; chunkIdx < chunkOffsets.length; chunkIdx++) {
    let samplesInChunk = 1;
    for (let i = samplesToChunks.length - 1; i >= 0; i--) {
      if (chunkIdx + 1 >= samplesToChunks[i].firstChunk) {
        samplesInChunk = samplesToChunks[i].samplesPerChunk;
        break;
      }
    }
    let frameOffset = chunkOffsets[chunkIdx];
    for (let s = 0; s < samplesInChunk && sampleIdx < sampleSizes.length; s++) {
      frames.push({ offset: frameOffset, size: sampleSizes[sampleIdx] });
      frameOffset += sampleSizes[sampleIdx];
      sampleIdx++;
    }
  }

  return { asc, frames };
}

// --- Decode M4A to mono PCM using FAAD2 ---

async function decodeM4a(
  fileBuffer: ArrayBuffer,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const { asc, frames: allFrames } = parseMp4(fileBuffer);
  const fileBytes = new Uint8Array(fileBuffer);
  // deno-lint-ignore no-explicit-any
  const mod: any = await getFaad2Module();

  // Only decode the middle ~15s worth of frames to save CPU
  const ascSR = sampleRateFromASC(asc);
  const frames = selectMiddleFrames(allFrames, ascSR);

  // Initialize decoder with AudioSpecificConfig
  const ascPtr = mod._malloc(asc.length);
  mod.HEAPU8.set(asc, ascPtr);
  const initResult = mod._init_decoder(ascPtr, asc.length);
  mod._free(ascPtr);
  if (initResult < 0)
    throw new HttpError(`FAAD2 init failed: ${initResult}`, 500);

  // Decode selected frames
  const pcmChunks: Float32Array[] = [];
  let sampleRate = 0;
  let channels = 0;
  const PAD = 64;

  const outBufSize = 2048 * 4 * Float32Array.BYTES_PER_ELEMENT;
  const outPtr = mod._malloc(outBufSize);

  for (const frame of frames) {
    const inPtr = mod._malloc(frame.size + PAD);
    mod.HEAPU8.set(
      fileBytes.subarray(frame.offset, frame.offset + frame.size),
      inPtr,
    );
    mod.HEAPU8.fill(0, inPtr + frame.size, inPtr + frame.size + PAD);

    const packed = mod._decode_frame(inPtr, frame.size, outPtr, outBufSize);
    mod._free(inPtr);
    if (packed <= 0) continue;

    const sr = FAAD2_SAMPLE_RATES[(packed >>> 28) & 0xf] || 0;
    const ch = (packed >>> 24) & 0xf;
    const totalSamples = packed & 0xffffff;
    if (sr > 0) sampleRate = sr;
    if (ch > 0) channels = ch;

    pcmChunks.push(
      new Float32Array(
        mod.HEAPU8.buffer.slice(outPtr, outPtr + totalSamples * 4),
      ),
    );
  }

  mod._free(outPtr);
  if (!sampleRate || !pcmChunks.length)
    throw new HttpError("FAAD2 decoded no audio frames", 500);

  // Concatenate chunks
  const totalLen = pcmChunks.reduce((sum, c) => sum + c.length, 0);
  const interleaved = new Float32Array(totalLen);
  let offset = 0;
  for (const chunk of pcmChunks) {
    interleaved.set(chunk, offset);
    offset += chunk.length;
  }

  // Downmix to mono
  if (channels <= 1) return { samples: interleaved, sampleRate };

  const monoLen = Math.floor(totalLen / channels);
  const mono = new Float32Array(monoLen);
  for (let i = 0; i < monoLen; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) sum += interleaved[i * channels + ch];
    mono[i] = sum / channels;
  }
  return { samples: mono, sampleRate };
}

// --- Schemas ---

const jobSchema = z.object({ jobId: z.number(), id: z.string() });
type Job = z.infer<typeof jobSchema>;
type FailedJob = Job & { error: string };

// --- Core Logic ---

async function generateEmbedding(url: string): Promise<number[]> {
  const response = await fetch(url);
  if (!response.ok)
    throw new HttpError(`Failed to fetch audio: ${response.status}`, 502);
  const arrayBuffer = await response.arrayBuffer();

  const { samples, sampleRate } = await decodeM4a(arrayBuffer);

  // Resample to 16kHz via linear interpolation
  let mono16k: Float32Array;
  if (sampleRate !== TARGET_SR) {
    const ratio = sampleRate / TARGET_SR;
    const outLen = Math.round(samples.length / ratio);
    mono16k = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const frac = srcIdx - lo;
      mono16k[i] =
        samples[lo] * (1 - frac) +
        samples[Math.min(lo + 1, samples.length - 1)] * frac;
    }
  } else {
    mono16k = samples;
  }

  // Extract middle 15s window, zero-pad if shorter
  const waveform = new Float32Array(TARGET_SAMPLES);
  if (mono16k.length >= TARGET_SAMPLES) {
    const start = Math.floor((mono16k.length - TARGET_SAMPLES) / 2);
    waveform.set(mono16k.subarray(start, start + TARGET_SAMPLES));
  } else {
    waveform.set(mono16k, Math.floor((TARGET_SAMPLES - mono16k.length) / 2));
  }

  // ONNX inference — model expects [batch=1, channels=1, time]
  const session = await getOnnxSession();
  const output = await session.run({
    waveform: new ort.Tensor("float32", waveform, [1, 1, TARGET_SAMPLES]),
  });

  return Array.from(output.embedding.data as Float32Array);
}

async function processJob(job: Job) {
  await sql.begin(async () => {
    const [song] = await sql`
      SELECT id, preview_url FROM public.songs WHERE id = ${job.id} FOR UPDATE
    `;
    if (!song) throw new HttpError(`Song ${job.id} not found`, 404);

    const embedding = await generateEmbedding(song.preview_url);

    await sql`
      WITH nearest AS (
        SELECT public.find_nearest_centroid(${JSON.stringify(embedding)}) as cid
      )
      UPDATE public.songs
      SET embedding = ${JSON.stringify(embedding)},
          centroid_id = (SELECT cid FROM nearest)
      WHERE id = ${job.id}
    `;
    await sql`SELECT util.dequeue('embedding_jobs', ${job.jobId})`;
  });
}

// --- Handler ---

Deno.serve(async (req) => {
  try {
    authenticateInternalRequest(req);
    if (req.method !== "POST") throw new HttpError("Method Not Allowed", 405);

    const result = z
      .array(jobSchema)
      .safeParse(await req.json().catch(() => []));
    if (!result.success)
      return jsonResponse({ error: result.error.issues }, 400);

    const pendingJobs = result.data;
    const completedJobs: Job[] = [];
    const failedJobs: FailedJob[] = [];

    const worker = async () => {
      let job: Job | undefined;
      while ((job = pendingJobs.shift())) {
        try {
          await processJob(job);
          completedJobs.push(job);
        } catch (error: unknown) {
          failedJobs.push({
            ...job,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    };

    await Promise.race([
      Promise.all(Array.from({ length: CONCURRENCY_LIMIT }, worker)),
      new Promise((_, reject) =>
        addEventListener("beforeunload", () =>
          reject(new Error("Worker terminating")),
        ),
      ),
    ]).catch(() => {
      pendingJobs.forEach((j) =>
        failedJobs.push({ ...j, error: "Termination" }),
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
      },
    );
  } catch (error: unknown) {
    const { message, status } = handleError(
      "Embedding Processing Error",
      error,
    );
    return jsonResponse({ error: message }, status);
  }
});
