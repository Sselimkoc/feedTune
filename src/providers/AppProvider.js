"use client";

import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LoadingState } from "@/components/core/states/LoadingState";
import { Toaster } from "@/components/core/ui/toaster";
import { ToastProvider } from "@/components/core/ui/toast";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Main application provider component
 * Combines all context providers:
 * - React Query
 * - i18n (internationalization)
 * - Theme
 * - Auth
 *
 * @param {object} children - Child components
 * @returns {JSX.Element}
 */
export function AppProvider({ children }) {
  // Create query client with optimized defaults
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 10, // 10 minutes
        cacheTime: 1000 * 60 * 60, // 1 hour
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
      },
      mutations: {
        retry: 2,
        retryDelay: 1000,
      },
    },
  });

  // Initialize auth state on mount
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={<LoadingState minimal />}>
              {children}
              <Toaster
                position="bottom-right"
                expand={false}
                richColors
                closeButton
              />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
