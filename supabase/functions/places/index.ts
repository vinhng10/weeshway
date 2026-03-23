import { z } from "zod";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

const autocompleteSchema = z.object({
  action: z.literal("autocomplete"),
  textQuery: z.string().min(1).max(200),
  sessionToken: z.string().uuid(),
});

const detailsSchema = z.object({
  action: z.literal("details"),
  placeId: z.string().min(1),
  sessionToken: z.uuid(),
});

const requestSchema = z.discriminatedUnion("action", [
  autocompleteSchema,
  detailsSchema,
]);

async function handleAutocomplete(textQuery: string, sessionToken: string) {
  const response = await fetch(
    `${GOOGLE_PLACES_BASE_URL}/places:autocomplete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input: textQuery,
        sessionToken,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Autocomplete error:", errorText);
    throw new Error("Failed to fetch autocomplete suggestions");
  }

  return response.json();
}

async function handleDetails(placeId: string, sessionToken: string) {
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "shortFormattedAddress",
    "addressComponents",
    "location",
    "googleMapsUri",
  ].join(",");

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places/${placeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": fieldMask,
      "X-Goog-Session-Token": sessionToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Place Details error:", errorText);
    throw new Error("Failed to fetch place details");
  }

  return response.json();
}

Deno.serve(async (req) => {
  try {
    await authenticateRequest(req);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405);
    }

    const body = requestSchema.parse(await req.json());

    if (body.action === "autocomplete") {
      const data = await handleAutocomplete(body.textQuery, body.sessionToken);
      return jsonResponse(data);
    }

    const data = await handleDetails(body.placeId, body.sessionToken);
    return jsonResponse(data);
  } catch (error: unknown) {
    const { message, status } = handleError("Places API Error", error);
    return jsonResponse({ error: message }, status);
  }
});
