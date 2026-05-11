import { ApiResponse } from "@/lib/api/response";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { email } = body;
  if (!email) return ApiResponse.badRequest("email is required");

  const supabase = createServiceRoleClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: "check_email_existence_only",
  });

  if (!error) return ApiResponse.ok({ exists: true, verified: true });

  const msg = error.message?.toLowerCase() ?? "";

  if (msg.includes("email not found") || msg.includes("invalid login credentials")) {
    return ApiResponse.ok({ exists: false });
  }
  if (msg.includes("email not confirmed")) {
    return ApiResponse.ok({ exists: true, verified: false });
  }

  return ApiResponse.ok({ exists: true, verified: true });
}
