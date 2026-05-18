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

  const { email, lang = "tr" } = body;
  if (!email) return ApiResponse.badRequest("Email is required");

  const adminClient = createServiceRoleClient();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "signup",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    const alreadyConfirmed =
      linkError?.message?.toLowerCase().includes("already confirmed") ||
      linkError?.message?.toLowerCase().includes("already registered");
    if (alreadyConfirmed) {
      return ApiResponse.badRequest("already_confirmed");
    }
    console.error("[resend-verification] generateLink error:", linkError);
    return ApiResponse.error("Failed to generate verification link");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const name = email.split("@")[0];

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "FeedTune <noreply@feedtune.app>",
    to: email,
    subject: getEmailSubject("resend", lang),
    html: buildVerificationEmail(name, linkData.properties.action_link, { isResend: true, lang }),
  });

  if (sendError) {
    console.error("[resend-verification] send error:", sendError);
    return ApiResponse.error("Failed to send verification email");
  }

  return ApiResponse.ok({ success: true });
}
