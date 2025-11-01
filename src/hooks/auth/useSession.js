"use client";

import { useAuthStore } from "@/store/useAuthStore";

/**
 * useSession Hook
 * Get current session and authentication state
 *
 * @returns {Object} { user, session, isLoading, isAuthenticated }
 */
export function useSession() {
  const { user, session, isLoading } = useAuthStore();

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
  };
}
