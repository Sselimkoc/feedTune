/**
 * Session Service
 * Server-side authentication and session management (Next.js 15+ Compatible)
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create server-side Supabase client
 * Handles async cookies for Next.js 15
 */
async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Component'lerde çerez set etmek bazen hata verebilir,
            // bu durum genellikle Middleware tarafından yönetilir.
            console.debug("[sessionService] Cookie setAll warning:", error?.message);
          }
        },
      },
    }
  );
}

/**
 * Get current authenticated user
 */
export async function getSecureUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (error.status === 400) {
        return null;
      }
      throw error;
    }

    return data?.user || null;
  } catch (error) {
    console.error("[sessionService] getSecureUser error:", error);
    return null;
  }
}

/**
 * Get current user ID
 */
export async function getSecureUserId() {
  const user = await getSecureUser();
  return user?.id || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getSecureUser();
  return !!user;
}

/**
 * Validate user session and return user data
 */
export async function validateUserSession() {
  try {
    const user = await getSecureUser();

    if (!user) {
      return { user: null, error: "User not authenticated" };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}