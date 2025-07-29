/**
 * Server-side authentication utilities
 * This module provides secure authentication functions for server-side operations
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a secure server-side Supabase client
 * @returns {Object} Supabase client instance
 */
export function createSecureServerClient() {
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
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/**
 * Securely checks the current user session using getUser()
 * @returns {Promise<Object|null>} User information or null
 */
export async function getSecureUser() {
  try {
    const supabase = createSecureServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error during secure user check:", error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Error during secure user check:", error);
    return null;
  }
}

/**
 * Securely gets the current user ID
 * @returns {Promise<string|null>} User ID or null
 */
export async function getSecureUserId() {
  try {
    const user = await getSecureUser();
    return user?.id || null;
  } catch (error) {
    console.error("Could not get secure user ID:", error);
    return null;
  }
}

/**
 * Securely checks if user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated
 */
export async function isAuthenticated() {
  try {
    const user = await getSecureUser();
    return !!user;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}

/**
 * Securely validates user session and returns user data
 * @returns {Promise<Object>} Object with user and error properties
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
    console.error("Error validating user session:", error);
    return {
      user: null,
      error: error.message || "Authentication error",
    };
  }
}
