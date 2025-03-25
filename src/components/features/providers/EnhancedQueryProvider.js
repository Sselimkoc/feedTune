"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Geliştirilmiş React Query sağlayıcısı.
 * Repository ve servis katmanı mimarisiyle uyumlu çalışır.
 *
 * @param {object} children - Alt bileşenler
 * @returns {JSX.Element}
 */
export function EnhancedQueryProvider({ children }) {
  // React Query client'ını oluştur
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 2, // 2 dakika - Veriler bu süre sonra "stale" olur
            gcTime: 1000 * 60 * 60, // 60 dakika - Cache bu süre saklanır
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
