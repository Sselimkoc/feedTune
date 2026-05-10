"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useAuthState() {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    isAuthenticated: false,
    isInitialized: false,
  });

  const initRef = useRef(false);
  const { user: storeUser, session: storeSession } = useAuthStore();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    setAuthState({
      user: storeUser ?? null,
      session: storeSession ?? null,
      isAuthenticated: !!(storeUser && storeSession),
      isInitialized: true,
    });
  }, []);

  useEffect(() => {
    if (!initRef.current) return;

    setAuthState((prev) => {
      if (storeUser && storeSession) {
        if (prev.user?.id === storeUser.id) return prev;
        return { user: storeUser, session: storeSession, isAuthenticated: true, isInitialized: true };
      }
      if (!storeUser && prev.user) {
        return { user: null, session: null, isAuthenticated: false, isInitialized: true };
      }
      return prev;
    });
  }, [storeUser, storeSession]);

  return authState;
}
