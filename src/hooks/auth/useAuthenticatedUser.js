"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useAuthenticatedUser() {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        setUserId(user?.id || null);
      } catch (error) {
        console.error("Error getting authenticated user:", error);
        setError(error);
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserId();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!error && user) {
          setUserId(user.id);
        }
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { userId, isLoading, error };
}
