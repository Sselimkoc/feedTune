"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Session management custom hook
 * Provides authentication state and user information
 *
 * @returns {Object} Object containing session and user information
 */
export function useSession() {
  const { user, session, setSession, loading: authLoading } = useAuthStore();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check session when component mounts
  useEffect(() => {
    const loadSession = async () => {
      if (!isLoaded) {
        setIsLoading(true);
        try {
          const supabase = createClientComponentClient();

          // Get session
          const { data: sessionData } = await supabase.auth.getSession();

          // More secure approach to get authenticated user data
          if (sessionData?.session) {
            const { data: userData } = await supabase.auth.getUser();
            await setSession({
              ...sessionData.session,
              user: userData?.user || sessionData.session.user,
            });
          } else {
            await setSession(null);
          }
        } catch (error) {
          console.error("Session check error:", error);
        } finally {
          setIsLoaded(true);
          setIsLoading(false);
        }
      }
    };

    loadSession();
  }, [isLoaded, setSession]);

  return {
    user,
    session,
    isLoading: isLoading || authLoading,
    isAuthenticated: !!session,
  };
}
