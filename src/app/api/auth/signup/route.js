import { ApiResponse } from "@/lib/api/response";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { email, password, displayName } = body;
  if (!email) return ApiResponse.badRequest("Email is required");
  if (!password) return ApiResponse.badRequest("Password is required");
  if (password.length < 6) return ApiResponse.badRequest("Password must be at least 6 characters");

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      display_name: displayName || email.split("@")[0],
    },
  });

  if (error) {
    if (
      error.message?.includes("already registered") ||
      error.message?.includes("User already exists")
    ) {
      return ApiResponse.conflict("This email is already registered");
    }
    return ApiResponse.error("Failed to create account");
  }

  return ApiResponse.ok({ success: true, needsVerification: true, userId: data.user?.id }, 201);
}
