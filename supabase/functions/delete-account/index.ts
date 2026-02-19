import { SupabaseClient } from "supabase";
import {
  authenticateRequest,
  createServiceRoleClient,
} from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

async function purgeFolder(
  admin: SupabaseClient,
  bucket: string,
  folder: string
) {
  const { data: items } = await admin.storage.from(bucket).list(folder);
  if (!items?.length) return;

  // Separate files (have IDs) and subfolders (no IDs)
  const files = items.filter((i) => i.id).map((i) => `${folder}/${i.name}`);
  const subfolders = items
    .filter((i) => !i.id)
    .map((i) => `${folder}/${i.name}`);

  // Delete files and recurse subfolders in parallel
  if (files.length) await admin.storage.from(bucket).remove(files);
  await Promise.all(subfolders.map((sub) => purgeFolder(admin, bucket, sub)));

  // If we hit the limit (1000), run again to ensure the folder is empty
  if (items.length === 1000) await purgeFolder(admin, bucket, folder);
}

Deno.serve(async (req) => {
  try {
    const { user } = await authenticateRequest(req);
    const adminClient = createServiceRoleClient();

    await purgeFolder(adminClient, "profiles", user.id);
    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return jsonResponse({ success: true });
  } catch (err) {
    const { message, status } = handleError("Delete Account Error", err);
    return jsonResponse({ error: message }, status);
  }
});
