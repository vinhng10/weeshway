import { createServiceRoleClient } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

// --- Configuration ---
const supabase = createServiceRoleClient();
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");

// --- Types ---
interface Notification {
  id: string;
  user_id: string;
  body: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Notification;
  schema: "public";
  old_record: null | Notification;
}

// --- Main Handler ---
Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405);
    }

    if (!EXPO_ACCESS_TOKEN) {
      throw new Error("EXPO_ACCESS_TOKEN is not configured");
    }

    const payload: WebhookPayload = await req.json();

    // Only process INSERT events for notifications
    if (payload.type !== "INSERT" || payload.table !== "notifications") {
      return jsonResponse({ received: true, skipped: true });
    }

    // Fetch user's Expo push token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", payload.record.user_id)
      .single();

    if (profileError || !profile?.expo_push_token) {
      console.warn(
        `No push token found for user ${payload.record.user_id}`,
        profileError
      );
      return jsonResponse({ received: true, skipped: true });
    }

    // Send push notification via Expo
    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
        Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: profile.expo_push_token,
        sound: "default",
        title: payload.record.id.toString(),
        body: payload.record.body || payload.record.user_id.toString(),
      }),
    });

    const result = await expoResponse.json();

    if (!expoResponse.ok) {
      console.error("Expo push notification failed:", result);
      throw new Error("Failed to send push notification");
    }

    return jsonResponse({ received: true, result });
  } catch (error: unknown) {
    const { message, status } = handleError("Push Notification Error", error);
    return jsonResponse({ error: message }, status);
  }
});
