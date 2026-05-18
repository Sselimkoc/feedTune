import { ApiResponse } from "@/lib/api/response";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { Resend } from "resend";
import { buildVerificationEmail, getEmailSubject } from "@/lib/email/verificationTemplate";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { email, password, displayName, lang = "tr" } = body;
  if (!email) return ApiResponse.badRequest("Email is required");
  if (!password) return ApiResponse.badRequest("Password is required");
  if (password.length < 6) return ApiResponse.badRequest("Password must be at least 6 characters");

  const adminClient = createServiceRoleClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      display_name: displayName || email.split("@")[0],
    },
  });

  if (error) {
    console.error("[signup] createUser error:", JSON.stringify(error));
    if (
      error.message?.includes("already registered") ||
      error.message?.includes("User already exists")
    ) {
      return ApiResponse.conflict("This email is already registered");
    }
    return ApiResponse.error(error.message || "Failed to create account");
  }

  if (data.user && data.user.identities?.length === 0) {
    return ApiResponse.conflict("This email is already registered");
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  console.log("[signup] appUrl:", appUrl);
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "signup",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[signup] generateLink error:", linkError);
    return ApiResponse.ok({ success: true, needsVerification: true, userId: data.user?.id }, 201);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const name = displayName || email.split("@")[0];

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "FeedTune <noreply@feedtune.app>",
    to: email,
    subject: getEmailSubject("signup", lang),
    html: buildVerificationEmail(name, linkData.properties.action_link, { lang }),
  });

  return ApiResponse.ok({ success: true, needsVerification: true, userId: data.user?.id }, 201);
}
