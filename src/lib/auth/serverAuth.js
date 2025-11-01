/**
 * Session Service
 * Server-side authentication and session management
 *
 * Handles:
 * - Session validation
 * - User retrieval
 * - Token management
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create server-side Supabase client
 * New instance per request to handle cookie updates
 */
function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.debug("[sessionService] Cookie set error:", error?.message);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.debug(
              "[sessionService] Cookie remove error:",
              error?.message
            );
          }
        },
      },
    }
  );
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function getSecureUser() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Status 400 means no active session - this is normal
      if (error.status === 400) {
        console.debug("[sessionService] No active session");
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
 * @returns {Promise<string|null>} User ID or null
 */
export async function getSecureUserId() {
  try {
    const user = await getSecureUser();
    return user?.id || null;
  } catch (error) {
    console.error("[sessionService] getSecureUserId error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated
 */
export async function isAuthenticated() {
  try {
    const user = await getSecureUser();
    return !!user;
  } catch (error) {
    console.error("[sessionService] isAuthenticated error:", error);
    return false;
  }
}

/**
 * Validate user session and return user data
 * @returns {Promise<Object>} { user, error }
 */
export async function validateUserSession() {
  try {
    const user = await getSecureUser();

    if (!user) {
      return {
        user: null,
        error: "User not authenticated",
      };
    }

    return {
      user,
      error: null,
    };
  } catch (error) {
    console.error("[sessionService] validateUserSession error:", error);
    return {
      user: null,
      error: error.message,
    };
  }
}
