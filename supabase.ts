import { createClient } from "@supabase/supabase-js";
import Storage from "expo-native-storage";

const supabaseUrl = "http://10.0.0.25:54321";
const supabasePublishableKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Uploads an avatar image to Supabase storage.
 * @param imageUri - The image URI (local or remote) to upload
 * @param pathPrefix - The path prefix for the file (e.g., "avatars", "locations")
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  imageUri: string,
  pathPrefix: string
): Promise<string> {
  // 1) Fetch the image
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  // 2) Define bucket and path
  const bucket = "images";
  const fileExtension = blob.type.split("/")[1] || "jpg";
  const filePath = `${pathPrefix}/${Date.now()}.${fileExtension}`;

  // 3) Upload the file
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, {
      contentType: blob.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // 4) Build the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}
