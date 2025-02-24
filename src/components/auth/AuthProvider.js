"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function AuthProvider({ children }) {
  const { user, setSession, checkSession } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === "TOKEN_REFRESHED" && session) {
        await setSession(session);
      }

      if (event === "SIGNED_OUT") {
        router.replace("/");
      }

      if (session) {
        await setSession(session);
      } else {
        // Oturum yoksa ve korumalı sayfadaysak ana sayfaya yönlendir
        const protectedRoutes = ["/settings", "/feeds", "/favorites"];
        const isProtectedRoute = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (isProtectedRoute) {
          router.replace("/");
        }
      }
    });

    // İlk yüklemede session kontrolü
    const initializeAuth = async () => {
      try {
        await checkSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Periyodik session kontrolü (5 dakikada bir)
    const interval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [pathname, router, setSession, checkSession, supabase.auth]);

  // Global loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return children;
}
