"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }) {
  const { initialize, setSession } = useAuthStore();

  useEffect(() => {
    // Email verification / magic links should land on /auth/callback, but if a link is opened
    // from a stale copy or lands on some other page, salvage it: redirect there with the hash
    // intact so the callback page's setSession() handling still runs.
    if (
      window.location.hash.includes("access_token=") &&
      window.location.pathname !== "/auth/callback"
    ) {
      window.location.replace(`/auth/callback${window.location.hash}`);
      return;
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.user, session);
      } else {
        setSession(null, null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [initialize, setSession]);

  return <>{children}</>;
}
