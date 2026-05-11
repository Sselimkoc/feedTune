import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = withAuth(async (_request, { user }) => {
  const supabase = createServiceRoleClient();

  const { data: existing, error: checkError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (checkError) {
    console.error("[ensure-user] check error:", checkError);
    return ApiResponse.error("Error occurred during user check");
  }

  if (existing) {
    return ApiResponse.ok({ success: true, user: { id: existing.id } });
  }

  const now = new Date().toISOString();
  const { data: newUser, error: createError } = await supabase
    .from("users")
    .insert({ id: user.id, email: user.email, created_at: now, updated_at: now })
    .select()
    .single();

  if (createError) {
    console.error("[ensure-user] create error:", createError);
    return ApiResponse.error("Failed to create user record");
  }

  return ApiResponse.ok({ success: true, user: newUser });
});

export function GET() {
  return ApiResponse.ok({ status: "available" });
}
