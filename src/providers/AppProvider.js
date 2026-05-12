"use client";

import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoadingState } from "@/components/core/states/LoadingState";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuthStore } from "@/store/useAuthStore";

export function AppProvider({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60,
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

  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={<LoadingState minimal />}>
          {children}
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}
