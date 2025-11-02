import { createBrowserClient } from "@supabase/ssr";

// Global supabase instance
let supabaseInstance = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseInstance;
}

export async function resendVerificationEmail(email) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error resending verification email:", error);
    throw error;
  }
}
