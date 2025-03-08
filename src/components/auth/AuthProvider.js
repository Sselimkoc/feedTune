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
    // İlk yüklemede session kontrolü
    const initializeAuth = async () => {
      try {
        const session = await supabase.auth.getSession();

        if (session?.data?.session) {
          // Oturum varsa, state'i güncelle
          await setSession(session.data.session);

          // UI'ı güncellemek için router.refresh() çağır
          router.refresh();
        } else {
          // Oturum yoksa, state'i temizle
          await setSession(null);

          // Korumalı sayfadaysak ana sayfaya yönlendir
          const protectedRoutes = [
            "/settings",
            "/feeds",
            "/favorites",
            "/read-later",
          ];
          const isProtectedRoute = protectedRoutes.some((route) =>
            pathname.startsWith(route)
          );

          if (isProtectedRoute) {
            router.replace("/");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Session değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session) {
        await setSession(session);

        // Force a refresh of the current route to update UI components
        if (event === "SIGNED_IN") {
          router.refresh();
        }
      } else {
        await setSession(null);

        // Oturum yoksa ve korumalı sayfadaysak ana sayfaya yönlendir
        const protectedRoutes = [
          "/settings",
          "/feeds",
          "/favorites",
          "/read-later",
        ];
        const isProtectedRoute = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (event === "SIGNED_OUT") {
          router.replace("/");
        } else if (isProtectedRoute) {
          router.replace("/");
        }
      }
    });

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
