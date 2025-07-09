import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * API endpoint to check if an email exists in the database
 */
export async function POST(request) {
  try {
    // Get email from request body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create server client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Try to sign in with a fake password to check if the email exists
    // This is a workaround since we can't directly query the auth.users table
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: "check_email_existence_only",
    });

    // Analyze the error message to determine if email exists and its verification status
    if (!error) {
      // This shouldn't happen with our fake password
      return NextResponse.json({ exists: true, verified: true });
    }

    const errorMessage = error.message?.toLowerCase() || "";

    // Email doesn't exist
    if (
      errorMessage.includes("email not found") ||
      errorMessage.includes("invalid login credentials")
    ) {
      return NextResponse.json({ exists: false });
    }

    // Email exists but not verified
    if (errorMessage.includes("email not confirmed")) {
      return NextResponse.json({ exists: true, verified: false });
    }

    // If we get here, email exists and is verified
    return NextResponse.json({ exists: true, verified: true });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Failed to check email" },
      { status: 500 }
    );
  }
}
