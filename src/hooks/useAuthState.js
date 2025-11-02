"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { mockUser } from "@/lib/mockData";

export function useAuthState() {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    isAuthenticated: false,
    isInitialized: false,
  });

  const initRef = useRef(false);
  const { user: storeUser, session: storeSession } = useAuthStore();

  // Initialize auth state once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (storeUser && storeSession) {
      console.log("[useAuthState] Initialized with store user:", storeUser.id);
      setAuthState({
        user: storeUser,
        session: storeSession,
        isAuthenticated: true,
        isInitialized: true,
      });
    } else {
      console.log("[useAuthState] Initialized with mock user");
      const mockSession = {
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        user: mockUser,
      };

      setAuthState({
        user: mockUser,
        session: mockSession,
        isAuthenticated: true,
        isInitialized: true,
      });
    }
  }, []);

  // Sync with store changes
  useEffect(() => {
    if (!initRef.current) return;

    if (storeUser && storeSession) {
      setAuthState((prev) => {
        // Only update if changed
        if (prev.user?.id === storeUser.id) return prev;

        console.log("[useAuthState] Synced with store user:", storeUser.id);
        return {
          user: storeUser,
          session: storeSession,
          isAuthenticated: true,
          isInitialized: true,
        };
      });
    } else if (!storeUser && !storeSession) {
      setAuthState((prev) => {
        // Only sign out if currently logged in
        if (!prev.user) return prev;

        console.log("[useAuthState] Signed out");
        return {
          user: null,
          session: null,
          isAuthenticated: false,
          isInitialized: true,
        };
      });
    }
  }, [storeUser, storeSession]);

  return authState;
}
