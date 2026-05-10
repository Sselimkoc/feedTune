"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }) {
  const { initialize, setSession } = useAuthStore();

  useEffect(() => {
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
