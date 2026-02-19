import { authenticateRequest } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  try {
    const { user } = await authenticateRequest(req);

    const adminClient = createServiceRoleClient();
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) throw error;

    return jsonResponse({ success: true });
  } catch (error: unknown) {
    const { message, status } = handleError("Delete Account Error", error);
    return jsonResponse({ error: message }, status);
  }
});
