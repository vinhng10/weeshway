import { createClient } from "@supabase/supabase-js";
import { File } from "expo-file-system";
import Storage from "expo-native-storage";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./constants";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Uploads media (image or video) to Supabase storage.
 * @param bucket - The bucket to upload the media to
 * @param mediaUri - The media URI (local or remote) to upload
 * @param pathPrefix - The path prefix for the file
 * @returns The public URL of the uploaded media
 */
export async function uploadMedia(
  bucket: string,
  mediaUri: string,
  pathPrefix?: string
): Promise<string> {
  // 1) Fetch the file
  const file = new File(mediaUri);
  const arrayBuffer = await file.arrayBuffer();

  // 2) Define path
  const filePath = pathPrefix ? `${pathPrefix}/${file.name}` : `${file.name}`;

  // 3) Upload the file
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
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
