"use client";

import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LoadingState } from "@/components/core/states/LoadingState";
import { Toaster } from "@/components/core/ui/toaster";
import { ToastProvider } from "@/components/core/ui/toast";

/**
 * Component that combines all context providers for the application.
 * Includes React Query, ThemeProvider, and other providers.
 *
 * @param {object} children - Child components
 * @returns {JSX.Element}
 */
export function AppProvider({ children }) {
  // Create query client
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

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<LoadingState minimal />}>
            {children}
            <Toaster
              position="bottom-right"
              expand={false}
              richColors
              closeButton
            />
          </Suspense>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
