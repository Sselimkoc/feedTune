"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges, checkSession } from "@/lib/auth/userUtils";
import { useAuthStore } from "@/store/useAuthStore";

// Auth context oluştur
const AuthContext = createContext(null);

/**
 * Auth Provider bileşeni
 * Tüm uygulamada auth durumunu yönetir
 */
export function AuthProvider({ children }) {
  const { setSession, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // İlk yükleme kontrolü
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const session = await checkSession();
        if (session) {
          await setSession(session);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Auth değişikliklerini dinle
    const subscription = subscribeToAuthChanges(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await setSession(session);
      } else if (event === "SIGNED_OUT") {
        await setSession(null);
      }
    });

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, [setSession]);

  // Auth context değeri
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Auth durumunu kullanmak için hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
