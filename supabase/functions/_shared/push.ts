import { HttpError } from "./errors.ts";

const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound?: string | null;
  data?: Record<string, unknown>;
}

/**
 * Dispatch one or more push notifications to the Expo Push API.
 *
 * No-op for an empty list. Throws HttpError if the access token is missing or
 * Expo rejects the request. Callers that drive a job queue (notify, remind)
 * should let it throw so failed sends stay queued and retry; callers where the
 * push is a fire-and-forget side effect should catch and log.
 */
export async function sendPush(
  messages: PushMessage | PushMessage[],
): Promise<void> {
  const list = Array.isArray(messages) ? messages : [messages];
  if (!list.length) return;

  if (!EXPO_ACCESS_TOKEN) {
    throw new HttpError("Missing Expo access token", 500);
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(list),
  });

  if (!res.ok) throw new HttpError("Expo service failure", 502);
}
