"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";

/**
 * Uygulama için tüm context sağlayıcılarını birleştiren bileşen.
 * React Query, ThemeProvider ve diğer sağlayıcıları içerir.
 *
 * @param {object} children - Alt bileşenler
 * @returns {JSX.Element}
 */
export function AppProvider({ children }) {
  // React Query client'ını oluştur
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 2, // 2 dakika
            gcTime: 1000 * 60 * 60, // 60 dakika
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          {children}
          <Toaster position="bottom-right" closeButton richColors />
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
