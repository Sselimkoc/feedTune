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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session) {
        await setSession(session);

        if (event === "SIGNED_IN") {
          router.refresh();
        }
      } else {
        await setSession(null);

        // Redirect to home page if no session and on protected route
        const protectedRoutes = ["/settings", "/feeds", "/favorites"];
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

    const initializeAuth = async () => {
      try {
        await checkSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const interval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [pathname, router, setSession, checkSession, supabase.auth]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return children;
}
