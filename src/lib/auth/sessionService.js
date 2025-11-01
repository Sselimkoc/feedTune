/**
 * Session Service
 * Merkezi auth yönetimi ve session handling
 *
 * Bu file, authentication'un tüm server-side tarafını yönetir
 * - Session validation
 * - User retrieval
 * - Token management
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server tarafı Supabase client'ı oluştur
 * Her request için yeni instance kullan (cookie'yi güncelle)
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
            // Cookie setting can fail in some edge cases
            console.debug("[sessionService] Cookie set error:", error?.message);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.debug("[sessionService] Cookie remove error:", error?.message);
          }
        },
      },
    }
  );
}

/**
 * Aktif session'ı kontrol et ve user'ı döndür
 * @returns {Promise<Object|null>} User object veya null
 */
export async function getCurrentUser() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Missing session error normal, user authenticated değil
      if (error.status === 400) {
        console.debug("[sessionService] No active session");
        return null;
      }
      throw error;
    }

    return data?.user || null;
  } catch (error) {
    console.error("[sessionService] getCurrentUser error:", error);
    return null;
  }
}

/**
 * Session'ı doğrula ve user'ı al
 * @returns {Promise<Object>} { user, error }
 */
export async function validateSession() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, error: "Not authenticated" };
  }

  return { user, error: null };
}

/**
 * User ID'sini al
 * @returns {Promise<string|null>}
 */
export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * User'ın authenticated olup olmadığını kontrol et
 * @returns {Promise<boolean>}
 */
export async function isUserAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Session'ı yenile (token refresh)
 * @returns {Promise<Object>} { session, error }
 */
export async function refreshSession() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) throw error;

    return { session, error: null };
  } catch (error) {
    console.error("[sessionService] refreshSession error:", error);
    return { session: null, error };
  }
}

/**
 * User'ı sign out yap
 * @returns {Promise<Object>} { error }
 */
export async function signOutUser() {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("[sessionService] signOutUser error:", error);
    return { error };
  }
}
