"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Session management custom hook
 * Provides authentication state and user information
 *
 * @returns {Object} Object containing session and user information
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
